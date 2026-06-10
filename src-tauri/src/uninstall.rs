//! Desinstalador universal: lista todos los programas instalados (escritorio y
//! Store) leyendo el registro y permite desinstalarlos.

use crate::ps;
use serde::Serialize;
use serde_json::Value;

#[derive(Serialize)]
pub struct Program {
    id: String,
    name: String,
    version: String,
    publisher: String,
    source: String,
}

/// Lista los programas instalados (desde las claves Uninstall del registro).
#[tauri::command]
pub fn list_programs() -> Result<Vec<Program>, String> {
    let script = r#"
$ErrorActionPreference='SilentlyContinue'
$paths = @(
  'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
)
$items = foreach ($p in $paths) {
  Get-ItemProperty $p | Where-Object {
    $_.DisplayName -and -not $_.SystemComponent -and -not $_.ReleaseType -and -not $_.ParentKeyName -and ($_.UninstallString -or $_.QuietUninstallString)
  } | ForEach-Object {
    [PSCustomObject]@{
      id        = $_.PSChildName
      name      = $_.DisplayName
      version   = [string]$_.DisplayVersion
      publisher = [string]$_.Publisher
      hive      = if ($_.PSPath -like '*HKEY_CURRENT_USER*') { 'HKCU' } else { 'HKLM' }
    }
  }
}
$items | Sort-Object name -Unique | ConvertTo-Json -Compress
"#;
    let out = ps::ps_capture(script)?;
    if out.is_empty() {
        return Ok(vec![]);
    }
    let parsed: Value =
        serde_json::from_str(&out).map_err(|e| format!("No se pudo leer la lista: {e}"))?;
    let arr = match parsed {
        Value::Array(a) => a,
        other => vec![other],
    };
    let programs = arr
        .into_iter()
        .filter_map(|v| {
            Some(Program {
                id: v.get("id")?.as_str()?.to_string(),
                name: v.get("name")?.as_str()?.to_string(),
                version: v.get("version").and_then(|x| x.as_str()).unwrap_or("").to_string(),
                publisher: v
                    .get("publisher")
                    .and_then(|x| x.as_str())
                    .unwrap_or("")
                    .to_string(),
                source: v.get("hive").and_then(|x| x.as_str()).unwrap_or("HKLM").to_string(),
            })
        })
        .collect();
    Ok(programs)
}

/// Desinstala un programa. Lee del registro el comando de desinstalacion fresco
/// (no confiamos en datos enviados por la UI) y lo ejecuta.
#[tauri::command]
pub fn uninstall_program(id: String, source: String) -> Result<String, String> {
    // Validamos el id: nombre de subclave del registro.
    if id.is_empty()
        || id.contains('\'')
        || id.contains('"')
        || id.contains(';')
        || id.contains('`')
    {
        return Err("Identificador no valido".to_string());
    }
    let hive = if source == "HKCU" { "HKCU" } else { "HKLM" };
    let script = format!(
        r#"
$ErrorActionPreference='Stop'
$id = '{id}'
$candidates = @(
  "{hive}:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$id",
  "{hive}:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\$id"
)
$key = $candidates | Where-Object {{ Test-Path $_ }} | Select-Object -First 1
if (-not $key) {{ throw 'No se encontro el programa en el registro.' }}
$props = Get-ItemProperty $key
$cmd = $props.QuietUninstallString
if (-not $cmd) {{ $cmd = $props.UninstallString }}
if (-not $cmd) {{ throw 'Este programa no tiene comando de desinstalacion.' }}
# Para instaladores MSI forzamos modo silencioso.
if ($cmd -match 'msiexec') {{
  $cmd = $cmd -replace '/I', '/X' -replace '/i', '/x'
  if ($cmd -notmatch '/quiet') {{ $cmd = "$cmd /quiet /norestart" }}
}}
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $cmd -Wait -WindowStyle Hidden
'OK'
"#,
        id = id,
        hive = hive
    );
    ps::ps_capture(&script).map(|_| "Desinstalacion completada".to_string())
}
