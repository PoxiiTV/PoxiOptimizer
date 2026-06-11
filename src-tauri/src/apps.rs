//! Instalacion de aplicaciones mediante winget (gestor de paquetes de Windows).

use crate::ps;
use serde::Serialize;

#[derive(Serialize)]
pub struct WingetResult {
    id: String,
    name: String,
    version: String,
}

/// Busca paquetes en winget en vivo y devuelve los resultados.
#[tauri::command(async)]
pub fn winget_search(query: String) -> Result<Vec<WingetResult>, String> {
    let q = query.trim();
    if q.len() < 2 {
        return Ok(vec![]);
    }
    // Validamos la consulta para evitar inyección de argumentos.
    if !q.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, ' ' | '.' | '-' | '_' | '+')) {
        return Err("Búsqueda no válida".to_string());
    }
    let out = ps::run_powershell(&format!(
        "winget search \"{q}\" --accept-source-agreements --disable-interactivity | Out-String"
    ))?;
    Ok(parse_winget_table(&out.stdout))
}

/// Parsea la tabla de texto que devuelve `winget search` usando las posiciones
/// de las columnas de la cabecera (Name / Id / Version).
fn parse_winget_table(text: &str) -> Vec<WingetResult> {
    let lines: Vec<&str> = text.lines().collect();
    // Localizamos la fila de cabecera (contiene "Name" e "Id") y la separadora.
    let header_idx = lines.iter().position(|l| {
        let t = l.trim_start();
        (t.starts_with("Name") || t.starts_with("Nombre")) && l.contains("Id")
    });
    let Some(hi) = header_idx else { return vec![] };
    let header = lines[hi];
    let id_col = header.find("Id").unwrap_or(0);
    let ver_col = header.find("Version").or_else(|| header.find("Versión")).unwrap_or(header.len());

    let mut results = Vec::new();
    for line in lines.iter().skip(hi + 2) {
        // Saltamos líneas vacías, separadores o spinners de progreso.
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('-') || trimmed.chars().all(|c| "-\\|/ ".contains(c)) {
            continue;
        }
        if line.len() < id_col + 1 {
            continue;
        }
        let take = |a: usize, b: usize| -> String {
            let chars: Vec<char> = line.chars().collect();
            let end = b.min(chars.len());
            if a >= end { return String::new(); }
            chars[a..end].iter().collect::<String>().trim().to_string()
        };
        let name = take(0, id_col);
        let id = take(id_col, ver_col);
        let version = {
            let chars: Vec<char> = line.chars().collect();
            if ver_col < chars.len() {
                chars[ver_col..].iter().collect::<String>()
            } else {
                String::new()
            }
        };
        let version = version.split_whitespace().next().unwrap_or("").to_string();
        if id.is_empty() || name.is_empty() || id.contains(' ') {
            continue;
        }
        results.push(WingetResult { id, name, version });
        if results.len() >= 40 {
            break;
        }
    }
    results
}

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
