//! Informacion del sistema, estado de administrador, punto de restauracion y
//! estado de activacion de Windows.

use crate::ps;
use serde_json::Value;

/// Devuelve un objeto JSON con la informacion del equipo para el dashboard.
#[tauri::command(async)]
pub fn get_system_info() -> Result<Value, String> {
    // Construimos el JSON directamente en PowerShell para una sola llamada.
    let script = r#"
$ErrorActionPreference = 'SilentlyContinue'
$os  = Get-CimInstance Win32_OperatingSystem
$cpu = (Get-CimInstance Win32_Processor | Select-Object -First 1).Name
$cs  = Get-CimInstance Win32_ComputerSystem
$gpu = (Get-CimInstance Win32_VideoController | Where-Object { $_.AdapterRAM -gt 0 } | Select-Object -First 1).Name
$sysDrive = $env:SystemDrive
$disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$sysDrive'"
$ramTotal = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1)
$ramFree  = [math]::Round($os.FreePhysicalMemory / 1MB, 1)
$ramUsed  = [math]::Round($ramTotal - $ramFree, 1)
$ramPct   = if ($ramTotal -gt 0) { [math]::Round(($ramUsed / $ramTotal) * 100, 0) } else { 0 }
$diskTotal = [math]::Round($disk.Size / 1GB, 1)
$diskFree  = [math]::Round($disk.FreeSpace / 1GB, 1)
$diskUsed  = [math]::Round($diskTotal - $diskFree, 1)
$diskPct   = if ($diskTotal -gt 0) { [math]::Round(($diskUsed / $diskTotal) * 100, 0) } else { 0 }
$uptime = (Get-Date) - $os.LastBootUpTime
$obj = [ordered]@{
  os_name       = $os.Caption
  os_version    = $os.Version
  os_build      = $os.BuildNumber
  arch          = $os.OSArchitecture
  computer_name = $env:COMPUTERNAME
  user_name     = $env:USERNAME
  cpu           = $cpu
  gpu           = $gpu
  ram_total     = $ramTotal
  ram_used      = $ramUsed
  ram_percent   = $ramPct
  disk_total    = $diskTotal
  disk_used     = $diskUsed
  disk_free     = $diskFree
  disk_percent  = $diskPct
  uptime_hours  = [math]::Round($uptime.TotalHours, 1)
}
$obj | ConvertTo-Json -Compress
"#;
    let out = ps::ps_capture(script)?;
    serde_json::from_str(&out).map_err(|e| format!("No se pudo leer la informacion del sistema: {e}"))
}

/// Comprueba de forma nativa si el proceso actual esta elevado (administrador).
#[cfg(windows)]
pub fn is_elevated() -> bool {
    use windows_sys::Win32::Foundation::{CloseHandle, HANDLE};
    use windows_sys::Win32::Security::{
        GetTokenInformation, TokenElevation, TOKEN_ELEVATION, TOKEN_QUERY,
    };
    use windows_sys::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};

    unsafe {
        let mut token: HANDLE = std::ptr::null_mut();
        if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token) == 0 {
            return false;
        }
        let mut elevation = TOKEN_ELEVATION { TokenIsElevated: 0 };
        let mut size = 0u32;
        let ok = GetTokenInformation(
            token,
            TokenElevation,
            &mut elevation as *mut _ as *mut core::ffi::c_void,
            std::mem::size_of::<TOKEN_ELEVATION>() as u32,
            &mut size,
        );
        CloseHandle(token);
        ok != 0 && elevation.TokenIsElevated != 0
    }
}

#[cfg(not(windows))]
pub fn is_elevated() -> bool {
    false
}

/// Comando expuesto a la UI: indica si la app tiene privilegios de administrador.
#[tauri::command(async)]
pub fn is_admin() -> bool {
    is_elevated()
}

/// Estado de activacion de Windows. Devuelve { activated, edition, detail }.
#[tauri::command(async)]
pub fn get_activation_status() -> Result<Value, String> {
    let script = r#"
$ErrorActionPreference = 'SilentlyContinue'
# Filtramos por el ApplicationId de Windows para que WMI no enumere todos los
# productos (Office, etc.), lo que acelera muchisimo la consulta.
$lic = Get-CimInstance SoftwareLicensingProduct -Filter "ApplicationId='55c92734-d682-4d71-983e-d6ec3f16059f' AND PartialProductKey IS NOT NULL" | Select-Object -First 1
$edition = (Get-CimInstance Win32_OperatingSystem).Caption
if ($lic -and $lic.LicenseStatus -eq 1) {
  $activated = $true
  $detail = 'Windows activado'
} else {
  $activated = $false
  $detail = 'Windows no activado'
}
[ordered]@{ activated = $activated; edition = $edition; detail = $detail } | ConvertTo-Json -Compress
"#;
    let out = ps::ps_capture(script)?;
    serde_json::from_str(&out).map_err(|e| format!("No se pudo leer el estado de activacion: {e}"))
}

/// Reinicia el equipo inmediatamente.
#[tauri::command(async)]
pub fn restart_pc() -> Result<(), String> {
    ps::run_powershell("Restart-Computer -Force")?;
    Ok(())
}

/// Crea un punto de restauracion del sistema antes de aplicar cambios.
/// Habilita System Restore en la unidad del sistema si estuviera desactivado y
/// elimina temporalmente el limite de frecuencia para garantizar la creacion.
#[tauri::command(async)]
pub fn create_restore_point(description: String) -> Result<String, String> {
    let desc = description.replace('\'', "");
    let script = format!(
        r#"
$ErrorActionPreference = 'Stop'
try {{
  Enable-ComputerRestore -Drive "$env:SystemDrive\" -ErrorAction SilentlyContinue
  # Quitamos el limite de un punto cada 24h para esta operacion.
  New-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\SystemRestore" -Name "SystemRestorePointCreationFrequency" -Value 0 -PropertyType DWord -Force | Out-Null
  Checkpoint-Computer -Description '{desc}' -RestorePointType 'MODIFY_SETTINGS'
  'OK'
}} catch {{
  throw "No se pudo crear el punto de restauracion: $($_.Exception.Message)"
}}
"#
    );
    ps::ps_capture(&script).map(|_| "Punto de restauracion creado correctamente".to_string())
}
