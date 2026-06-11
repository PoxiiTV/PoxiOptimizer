//! Gestion de Windows Update con tres modos (inspirado en winutil):
//!   - default   : configuracion estandar de Windows.
//!   - security  : aplaza actualizaciones de caracteristicas, recibe solo
//!                 seguridad/calidad (recomendado para estabilidad).
//!   - disabled  : desactiva por completo Windows Update (no recomendado).
//!
//! Todo es reversible volviendo al modo "default".

use crate::ps;

const UX_SETTINGS: &str = r"HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings";

/// Devuelve el modo actual de Windows Update: "default" | "security" | "disabled".
#[tauri::command(async)]
pub fn get_windows_update_mode() -> Result<String, String> {
    let script = r#"
$ErrorActionPreference='SilentlyContinue'
$svc = (Get-Service -Name wuauserv).StartType
if ($svc -eq 'Disabled') { 'disabled'; return }
$defer = (Get-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings' -Name 'DeferFeatureUpdatesPeriodInDays' -ErrorAction SilentlyContinue).'DeferFeatureUpdatesPeriodInDays'
if ($defer -ge 30) { 'security' } else { 'default' }
"#;
    ps::ps_capture(script).map(|s| {
        let m = s.trim();
        if m == "disabled" || m == "security" || m == "default" {
            m.to_string()
        } else {
            "default".to_string()
        }
    })
}

/// Aplica el modo de Windows Update indicado.
#[tauri::command(async)]
pub fn set_windows_update_mode(mode: String) -> Result<String, String> {
    let script = match mode.as_str() {
        "security" => format!(
            r#"
$ErrorActionPreference='SilentlyContinue'
# Reactivar servicios por si estaban deshabilitados
Set-Service -Name wuauserv -StartupType Manual
Set-Service -Name UsoSvc -StartupType Automatic
Set-Service -Name BITS -StartupType Manual
# Aplazar caracteristicas (1 año) y calidad (4 dias): solo seguridad/estabilidad
if (-not (Test-Path '{ux}')) {{ New-Item -Path '{ux}' -Force | Out-Null }}
New-ItemProperty -Path '{ux}' -Name 'BranchReadinessLevel' -Value 20 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path '{ux}' -Name 'DeferFeatureUpdatesPeriodInDays' -Value 365 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path '{ux}' -Name 'DeferQualityUpdatesPeriodInDays' -Value 4 -PropertyType DWord -Force | Out-Null
'OK'
"#,
            ux = UX_SETTINGS
        ),
        "disabled" => r#"
$ErrorActionPreference='SilentlyContinue'
Stop-Service -Name wuauserv -Force
Set-Service -Name wuauserv -StartupType Disabled
Set-Service -Name UsoSvc -StartupType Disabled
Set-Service -Name BITS -StartupType Disabled
'OK'
"#
        .to_string(),
        "default" => format!(
            r#"
$ErrorActionPreference='SilentlyContinue'
Set-Service -Name wuauserv -StartupType Manual
Start-Service -Name wuauserv
Set-Service -Name UsoSvc -StartupType Automatic
Set-Service -Name BITS -StartupType Manual
Remove-ItemProperty -Path '{ux}' -Name 'BranchReadinessLevel' -ErrorAction SilentlyContinue
Remove-ItemProperty -Path '{ux}' -Name 'DeferFeatureUpdatesPeriodInDays' -ErrorAction SilentlyContinue
Remove-ItemProperty -Path '{ux}' -Name 'DeferQualityUpdatesPeriodInDays' -ErrorAction SilentlyContinue
'OK'
"#,
            ux = UX_SETTINGS
        ),
        other => return Err(format!("Modo de actualización no válido: {other}")),
    };
    ps::ps_capture(&script).map(|_| "Modo de Windows Update aplicado".to_string())
}
