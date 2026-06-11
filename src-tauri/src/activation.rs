//! Activacion de Windows y Office mediante Microsoft Activation Scripts (MAS),
//! el proyecto open-source de massgravel (https://github.com/massgravel).
//!
//! MAS es una herramienta de terceros cuya interfaz solo esta en ingles. Para
//! que la experiencia sea en espanol, ejecutamos su script oficial en segundo
//! plano (sin mostrar la consola) y devolvemos el resultado interpretado en
//! castellano. El "menu completo" si abre la consola original (avanzado).

use crate::ps;

/// Ejecuta el script oficial de MAS con los flags indicados, capturando la
/// salida (sin abrir ventana). Usa DNS-over-HTTPS como recomienda MAS.
fn run_mas_hidden(flags: &str) -> Result<ps::CmdOutput, String> {
    let inner = format!(
        "& ([ScriptBlock]::Create((curl.exe -L -s --doh-url https://1.1.1.1/dns-query https://get.activated.win | Out-String))) {flags}"
    );
    ps::run_powershell(&inner)
}

/// Comprueba si Windows esta activado consultando la licencia real.
fn windows_is_activated() -> bool {
    let script = r#"$l = Get-CimInstance SoftwareLicensingProduct -Filter "ApplicationId='55c92734-d682-4d71-983e-d6ec3f16059f' AND PartialProductKey IS NOT NULL" | Select-Object -First 1; if ($l -and $l.LicenseStatus -eq 1) {'yes'} else {'no'}"#;
    matches!(ps::ps_capture(script), Ok(s) if s.trim() == "yes")
}

/// Activa Windows de forma permanente con licencia digital (HWID) y verifica
/// el resultado real, devolviendo un mensaje en espanol.
#[tauri::command(async)]
pub fn activate_windows() -> Result<String, String> {
    if windows_is_activated() {
        return Ok("Windows ya estaba activado. ✅".to_string());
    }
    run_mas_hidden("/HWID")?;
    if windows_is_activated() {
        Ok("¡Windows activado correctamente! ✅".to_string())
    } else {
        Err("No se pudo activar Windows. Revisa tu conexión a internet e inténtalo de nuevo, o usa el menú completo de MAS.".to_string())
    }
}

/// Activa Microsoft Office de forma permanente (Ohook) y devuelve un mensaje en
/// espanol. La activacion de Office no siempre es verificable al instante.
#[tauri::command(async)]
pub fn activate_office() -> Result<String, String> {
    let out = run_mas_hidden("/Ohook")?;
    let o = out.stdout.to_lowercase();
    if out.success && (o.contains("successfully") || o.contains("activated") || o.contains("ohook")) {
        Ok("Proceso de activación de Office completado. Si tienes Office instalado, ya debería estar activado. ✅".to_string())
    } else {
        Ok("Proceso finalizado. Si Office no se activó, comprueba que esté instalado o usa el menú completo de MAS.".to_string())
    }
}

/// Abre el menu interactivo completo de MAS en una consola (en ingles, opcion
/// avanzada con todas las funciones de activacion y diagnostico).
#[tauri::command(async)]
pub fn open_mas_menu() -> Result<String, String> {
    let inner = "& ([ScriptBlock]::Create((curl.exe -L -s --doh-url https://1.1.1.1/dns-query https://get.activated.win | Out-String)))";
    ps::spawn_visible(
        "powershell.exe",
        &["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", inner],
    )?;
    Ok("Se ha abierto el menú completo de MAS en una ventana aparte.".to_string())
}
