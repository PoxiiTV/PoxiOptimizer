//! Activacion de Windows y Office mediante Microsoft Activation Scripts (MAS),
//! el proyecto open-source de massgravel (https://github.com/massgravel).
//!
//! Se invoca el script oficial de MAS en modo desatendido. Se abre una ventana
//! de consola para que el usuario vea el progreso del proceso.

use crate::ps;

/// Construye el comando de PowerShell que ejecuta MAS con los flags indicados.
/// Usa DNS-over-HTTPS de Cloudflare para evitar bloqueos de DNS, tal y como
/// recomienda la documentacion oficial de MAS para la automatizacion.
fn mas_command(flags: &str) -> Vec<String> {
    let inner = format!(
        "& ([ScriptBlock]::Create((curl.exe -L -s --doh-url https://1.1.1.1/dns-query https://get.activated.win | Out-String))) {flags}"
    );
    vec![
        "-NoProfile".to_string(),
        "-ExecutionPolicy".to_string(),
        "Bypass".to_string(),
        "-Command".to_string(),
        inner,
    ]
}

fn launch_mas(flags: &str) -> Result<String, String> {
    let args = mas_command(flags);
    let arg_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();
    ps::spawn_visible("powershell.exe", &arg_refs)?;
    Ok("Proceso de activacion iniciado. Sigue el progreso en la ventana que se ha abierto.".to_string())
}

/// Activa Windows de forma permanente con licencia digital (HWID).
#[tauri::command]
pub fn activate_windows() -> Result<String, String> {
    launch_mas("/HWID")
}

/// Activa Microsoft Office de forma permanente (Ohook).
#[tauri::command]
pub fn activate_office() -> Result<String, String> {
    launch_mas("/Ohook")
}

/// Abre el menu interactivo completo de MAS (todas las opciones disponibles).
#[tauri::command]
pub fn open_mas_menu() -> Result<String, String> {
    launch_mas("")
}
