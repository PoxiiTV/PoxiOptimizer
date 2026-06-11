//! Lectura de temperaturas de CPU y GPU via WMI / nvidia-smi.
//! Falla silenciosamente (devuelve None) si el sensor no esta disponible.

use crate::ps;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default)]
pub struct TempInfo {
    pub cpu: Option<i32>,
    pub gpu: Option<i32>,
}

#[tauri::command(async)]
pub fn get_temperatures() -> TempInfo {
    let script = r#"
$ErrorActionPreference = 'SilentlyContinue'
$cpu = $null
$gpu = $null

# CPU via MSAcpi_ThermalZoneTemperature (root/WMI)
try {
    $tz = Get-CimInstance -Namespace root/WMI -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction SilentlyContinue |
          Where-Object { $_.CurrentTemperature -gt 2731 } |
          Select-Object -First 1
    if ($tz) { $cpu = [int][math]::Round($tz.CurrentTemperature / 10 - 273.15) }
} catch {}

# GPU via nvidia-smi (NVIDIA)
try {
    $raw = & nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits 2>$null
    if ($raw -and ($raw.Trim() -match '^\d+$')) { $gpu = [int]$raw.Trim() }
} catch {}

[PSCustomObject]@{ cpu = $cpu; gpu = $gpu } | ConvertTo-Json -Compress
"#;

    match ps::ps_capture(script) {
        Ok(out) => serde_json::from_str::<TempInfo>(&out).unwrap_or_default(),
        Err(_) => TempInfo::default(),
    }
}
