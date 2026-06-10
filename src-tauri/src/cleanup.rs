//! Limpieza del sistema: archivos temporales, cache de Windows Update, papelera
//! y flush de DNS. Calcula el espacio liberado.

use crate::ps;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct CleanupResult {
    freed_mb: f64,
    details: Vec<String>,
}

/// Ejecuta una limpieza segura del sistema y devuelve el espacio liberado.
/// Solo elimina contenido de carpetas temporales y caches reconstruibles.
#[tauri::command(async)]
pub fn run_cleanup(temp: bool, update_cache: bool, recycle_bin: bool, dns: bool) -> Result<CleanupResult, String> {
    let script = format!(
        r#"
$ErrorActionPreference='SilentlyContinue'
$freed = 0
$details = @()

function Get-FolderSize($path) {{
  if (Test-Path $path) {{
    return (Get-ChildItem $path -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
  }}
  return 0
}}

if (${temp}) {{
  $targets = @($env:TEMP, "$env:SystemRoot\Temp")
  $before = 0
  foreach ($t in $targets) {{ $before += Get-FolderSize $t }}
  foreach ($t in $targets) {{
    Get-ChildItem $t -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
  }}
  $after = 0
  foreach ($t in $targets) {{ $after += Get-FolderSize $t }}
  $freed += [math]::Max(0, $before - $after)
  $details += 'Archivos temporales'
}}

if (${update_cache}) {{
  $sd = "$env:SystemRoot\SoftwareDistribution\Download"
  $before = Get-FolderSize $sd
  Stop-Service wuauserv -Force -ErrorAction SilentlyContinue
  Get-ChildItem $sd -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
  Start-Service wuauserv -ErrorAction SilentlyContinue
  $after = Get-FolderSize $sd
  $freed += [math]::Max(0, $before - $after)
  $details += 'Cache de Windows Update'
}}

if (${recycle_bin}) {{
  try {{ Clear-RecycleBin -Force -ErrorAction Stop; $details += 'Papelera de reciclaje' }} catch {{}}
}}

if (${dns}) {{
  ipconfig /flushdns | Out-Null
  $details += 'Cache DNS'
}}

$mb = [math]::Round($freed / 1MB, 1)
[ordered]@{{ freed_mb = $mb; details = $details }} | ConvertTo-Json -Compress
"#,
        temp = if temp { "$true" } else { "$false" },
        update_cache = if update_cache { "$true" } else { "$false" },
        recycle_bin = if recycle_bin { "$true" } else { "$false" },
        dns = if dns { "$true" } else { "$false" },
    );
    let out = ps::ps_capture(&script)?;
    serde_json::from_str(&out).map_err(|e| format!("No se pudo completar la limpieza: {e}"))
}
