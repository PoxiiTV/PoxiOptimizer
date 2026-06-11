//! Limpieza del sistema: temporales, cachés, papelera, navegadores, miniaturas,
//! logs, WinSxS (DISM), cola de impresión y DNS. Calcula el espacio liberado.

use crate::ps;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct CleanupResult {
    freed_mb: f64,
    details: Vec<String>,
}

/// Ejecuta una limpieza segura del sistema. `options` es la lista de tareas a
/// realizar. Solo elimina contenido reconstruible (cachés y temporales).
#[tauri::command(async)]
pub fn run_cleanup(options: Vec<String>) -> Result<CleanupResult, String> {
    let has = |k: &str| options.iter().any(|o| o == k);

    // Construimos el script según las opciones marcadas.
    let mut body = String::from(
        r#"
$ErrorActionPreference='SilentlyContinue'
$freed = 0
$details = @()
function Get-FolderSize($path) {
  if (Test-Path $path) {
    return (Get-ChildItem $path -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
  }
  return 0
}
function Clear-Folder($paths, $label) {
  $before = 0; foreach ($p in $paths) { $before += Get-FolderSize $p }
  foreach ($p in $paths) {
    Get-ChildItem $p -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
  }
  $after = 0; foreach ($p in $paths) { $after += Get-FolderSize $p }
  $script:freed += [math]::Max(0, $before - $after)
  $script:details += $label
}
"#,
    );

    if has("temp") {
        body.push_str(r#"Clear-Folder @($env:TEMP, "$env:SystemRoot\Temp") 'Archivos temporales'"#);
        body.push('\n');
    }
    if has("update_cache") {
        body.push_str(
            r#"
Stop-Service wuauserv -Force -ErrorAction SilentlyContinue
Clear-Folder @("$env:SystemRoot\SoftwareDistribution\Download") 'Caché de Windows Update'
Start-Service wuauserv -ErrorAction SilentlyContinue
"#,
        );
    }
    if has("browser_cache") {
        body.push_str(
            r#"
$bc = @(
  "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
  "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache",
  "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\User Data\Default\Cache"
)
$ff = Get-ChildItem "$env:LOCALAPPDATA\Mozilla\Firefox\Profiles" -Directory -ErrorAction SilentlyContinue | ForEach-Object { Join-Path $_.FullName 'cache2' }
Clear-Folder ($bc + $ff) 'Caché de navegadores'
"#,
        );
    }
    if has("thumbnails") {
        body.push_str(
            r#"
$tp = "$env:LOCALAPPDATA\Microsoft\Windows\Explorer"
$before = (Get-ChildItem "$tp\thumbcache_*.db" -Force -EA SilentlyContinue | Measure-Object Length -Sum).Sum
Remove-Item "$tp\thumbcache_*.db" -Force -ErrorAction SilentlyContinue
$freed += [math]::Max(0, $before); $details += 'Miniaturas (thumbnails)'
"#,
        );
    }
    if has("win_logs") {
        body.push_str(r#"Clear-Folder @("$env:SystemRoot\Logs\CBS", "$env:SystemRoot\Logs\DISM") 'Logs de Windows'"#);
        body.push('\n');
    }
    if has("print_queue") {
        body.push_str(
            r#"
Stop-Service Spooler -Force -ErrorAction SilentlyContinue
Clear-Folder @("$env:SystemRoot\System32\spool\PRINTERS") 'Cola de impresión'
Start-Service Spooler -ErrorAction SilentlyContinue
"#,
        );
    }
    if has("recycle_bin") {
        body.push_str("try { Clear-RecycleBin -Force -ErrorAction Stop; $details += 'Papelera de reciclaje' } catch {}\n");
    }
    if has("dns") {
        body.push_str("ipconfig /flushdns | Out-Null; $details += 'Caché DNS'\n");
    }
    if has("winsxs") {
        // DISM puede tardar varios minutos; libera componentes antiguos.
        body.push_str("Dism.exe /online /Cleanup-Image /StartComponentCleanup /Quiet | Out-Null; $details += 'Componentes antiguos (WinSxS)'\n");
    }

    body.push_str(
        "\n$mb = [math]::Round($freed / 1MB, 1)\n[ordered]@{ freed_mb = $mb; details = $details } | ConvertTo-Json -Compress\n",
    );

    let out = ps::ps_capture(&body)?;
    serde_json::from_str(&out).map_err(|e| format!("No se pudo completar la limpieza: {e}"))
}
