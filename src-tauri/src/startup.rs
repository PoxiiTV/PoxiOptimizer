//! Gestor de programas de inicio (arranque con Windows).
//! Lista las entradas de Run (HKCU y HKLM) y permite activarlas/desactivarlas
//! usando StartupApproved, igual que el Administrador de tareas.

use crate::ps;
use serde::Serialize;
use serde_json::Value;

#[derive(Serialize)]
pub struct StartupItem {
    name: String,
    command: String,
    location: String, // "HKCU" | "HKLM"
    enabled: bool,
}

/// Lista los programas que arrancan con Windows.
#[tauri::command(async)]
pub fn list_startup() -> Result<Vec<StartupItem>, String> {
    let script = r#"
$ErrorActionPreference='SilentlyContinue'
function Get-Enabled($approved, $name) {
  $v = (Get-ItemProperty -Path $approved -Name $name -ErrorAction SilentlyContinue).$name
  if ($null -eq $v) { return $true }
  return (($v[0] -band 1) -eq 0)
}
$result = @()
$sources = @(
  @{ run='HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run'; approved='HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run'; loc='HKCU' },
  @{ run='HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run'; approved='HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run'; loc='HKLM' }
)
foreach ($s in $sources) {
  $key = Get-Item -Path $s.run -ErrorAction SilentlyContinue
  if ($key) {
    foreach ($name in $key.GetValueNames()) {
      if ([string]::IsNullOrWhiteSpace($name)) { continue }
      $result += [PSCustomObject]@{
        name = $name
        command = [string]$key.GetValue($name)
        location = $s.loc
        enabled = Get-Enabled $s.approved $name
      }
    }
  }
}
$result | ConvertTo-Json -Compress
"#;
    let out = ps::ps_capture(script)?;
    if out.is_empty() {
        return Ok(vec![]);
    }
    let parsed: Value =
        serde_json::from_str(&out).map_err(|e| format!("No se pudo leer el inicio: {e}"))?;
    let arr = match parsed {
        Value::Array(a) => a,
        other => vec![other],
    };
    let items = arr
        .into_iter()
        .filter_map(|v| {
            Some(StartupItem {
                name: v.get("name")?.as_str()?.to_string(),
                command: v.get("command").and_then(|x| x.as_str()).unwrap_or("").to_string(),
                location: v.get("location").and_then(|x| x.as_str()).unwrap_or("HKCU").to_string(),
                enabled: v.get("enabled").and_then(|x| x.as_bool()).unwrap_or(true),
            })
        })
        .collect();
    Ok(items)
}

/// Activa o desactiva un programa de inicio.
#[tauri::command(async)]
pub fn set_startup(name: String, location: String, enable: bool) -> Result<String, String> {
    if name.contains('\'') {
        return Err("Nombre no válido".to_string());
    }
    let hive = if location == "HKLM" { "HKLM" } else { "HKCU" };
    let bytes = if enable { "2,0,0,0,0,0,0,0,0,0,0,0" } else { "3,0,0,0,0,0,0,0,0,0,0,0" };
    let script = format!(
        r#"
$ErrorActionPreference='Stop'
$approved = '{hive}:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run'
if (-not (Test-Path $approved)) {{ New-Item -Path $approved -Force | Out-Null }}
Set-ItemProperty -Path $approved -Name '{name}' -Value ([byte[]]({bytes})) -Type Binary
'OK'
"#,
        hive = hive,
        name = name,
        bytes = bytes
    );
    ps::ps_capture(&script).map(|_| {
        if enable {
            "Programa habilitado en el inicio".to_string()
        } else {
            "Programa deshabilitado del inicio".to_string()
        }
    })
}

/// [POST-FORMATEO] Deshabilita TODOS los programas de inicio (HKCU y HKLM).
/// Devuelve cuántos se han desactivado.
#[tauri::command(async)]
pub fn disable_all_startup() -> Result<usize, String> {
    let script = r#"
$ErrorActionPreference='SilentlyContinue'
$count = 0
$sources = @(
  @{ run='HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run'; appr='HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run' },
  @{ run='HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run'; appr='HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run' }
)
foreach ($s in $sources) {
  $key = Get-Item -Path $s.run -ErrorAction SilentlyContinue
  if ($key) {
    if (-not (Test-Path $s.appr)) { New-Item -Path $s.appr -Force | Out-Null }
    foreach ($n in $key.GetValueNames()) {
      if ([string]::IsNullOrWhiteSpace($n)) { continue }
      Set-ItemProperty -Path $s.appr -Name $n -Value ([byte[]](3,0,0,0,0,0,0,0,0,0,0,0)) -Type Binary
      $count++
    }
  }
}
$count
"#;
    let out = ps::ps_capture(script)?;
    Ok(out.trim().parse::<usize>().unwrap_or(0))
}
