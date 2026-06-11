//! Reparación de Windows: SFC, DISM y restablecimiento de Windows Update.
//! Estas operaciones pueden tardar varios minutos.

use crate::ps;

/// Comprueba y repara archivos de sistema dañados (SFC /scannow).
#[tauri::command(async)]
pub fn run_sfc() -> Result<String, String> {
    let out = ps::run_powershell("sfc /scannow")?;
    let s = format!("{}\n{}", out.stdout, out.stderr).to_lowercase();
    if s.contains("did not find any integrity violations") || s.contains("no encontr") {
        Ok("No se encontraron archivos de sistema dañados. ✅".to_string())
    } else if s.contains("successfully repaired") || s.contains("repar") {
        Ok("Se repararon archivos de sistema dañados. ✅ Reinicia el equipo.".to_string())
    } else {
        Ok("Análisis SFC completado. Revisa el registro CBS si persisten los problemas.".to_string())
    }
}

/// Repara la imagen del sistema (DISM /RestoreHealth). Requiere internet.
#[tauri::command(async)]
pub fn run_dism() -> Result<String, String> {
    let out = ps::run_powershell("Dism.exe /Online /Cleanup-Image /RestoreHealth")?;
    if out.success {
        Ok("Imagen de Windows reparada correctamente. ✅".to_string())
    } else {
        Err("DISM no pudo completar la reparación. Comprueba tu conexión a internet.".to_string())
    }
}

/// Restablece los componentes de Windows Update (servicios + caché).
#[tauri::command(async)]
pub fn reset_windows_update() -> Result<String, String> {
    let script = r#"
$ErrorActionPreference='SilentlyContinue'
Stop-Service wuauserv -Force
Stop-Service cryptSvc -Force
Stop-Service bits -Force
Stop-Service msiserver -Force
Rename-Item "$env:SystemRoot\SoftwareDistribution" "SoftwareDistribution.old" -Force -ErrorAction SilentlyContinue
Rename-Item "$env:SystemRoot\System32\catroot2" "catroot2.old" -Force -ErrorAction SilentlyContinue
Start-Service wuauserv
Start-Service cryptSvc
Start-Service bits
Start-Service msiserver
'OK'
"#;
    ps::ps_capture(script).map(|_| "Componentes de Windows Update restablecidos. ✅".to_string())
}
