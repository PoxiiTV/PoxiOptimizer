//! Instalacion de aplicaciones mediante winget (gestor de paquetes de Windows).

use crate::ps;

/// Comprueba si winget esta disponible en el sistema.
#[tauri::command(async)]
pub fn winget_available() -> bool {
    matches!(
        ps::run_powershell("if (Get-Command winget -ErrorAction SilentlyContinue) { 'yes' } else { 'no' }"),
        Ok(o) if o.stdout.trim() == "yes"
    )
}

/// Instala una aplicacion por su id de winget de forma silenciosa.
#[tauri::command(async)]
pub fn install_app(winget_id: String) -> Result<String, String> {
    // Validamos el id: winget ids son alfanumericos con puntos, guiones y '+'.
    if winget_id.is_empty()
        || !winget_id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '-' | '_' | '+'))
    {
        return Err("Identificador de aplicacion no valido".to_string());
    }
    let script = format!(
        "winget install --id {id} -e --silent --accept-package-agreements --accept-source-agreements --disable-interactivity",
        id = winget_id
    );
    let out = ps::run_powershell(&script)?;
    // winget devuelve 0 en exito; tambien tratamos "ya instalado" como ok.
    if out.success
        || out.stdout.contains("ya est")
        || out.stdout.to_lowercase().contains("already installed")
    {
        Ok(format!("Instalado: {winget_id}"))
    } else {
        let detail = if out.stderr.is_empty() {
            out.stdout
        } else {
            out.stderr
        };
        Err(format!("No se pudo instalar {winget_id}: {detail}"))
    }
}
