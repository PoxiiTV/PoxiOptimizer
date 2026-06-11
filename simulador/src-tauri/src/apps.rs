//! [SIMULACIÓN] winget falso. No instala nada.

use serde::Serialize;

#[derive(Serialize)]
pub struct WingetResult {
    id: String,
    name: String,
    version: String,
}

#[tauri::command(async)]
pub fn winget_available() -> bool {
    true
}

#[tauri::command(async)]
pub fn install_app(winget_id: String) -> Result<String, String> {
    // Simula el tiempo de una instalación.
    std::thread::sleep(std::time::Duration::from_millis(1200));
    Ok(format!("[Simulación] Instalado: {winget_id}"))
}

#[tauri::command(async)]
pub fn winget_search(query: String) -> Result<Vec<WingetResult>, String> {
    let q = query.trim();
    if q.len() < 2 {
        return Ok(vec![]);
    }
    // Devolvemos resultados de ejemplo basados en la búsqueda.
    std::thread::sleep(std::time::Duration::from_millis(500));
    let r = |name: &str, id: &str, ver: &str| WingetResult {
        name: name.to_string(),
        id: id.to_string(),
        version: ver.to_string(),
    };
    Ok(vec![
        r(&format!("{q} (resultado de ejemplo)"), "Ejemplo.App", "1.2.3"),
        r("Google Chrome", "Google.Chrome", "126.0.6478.127"),
        r("Mozilla Firefox", "Mozilla.Firefox", "127.0.1"),
        r("7-Zip", "7zip.7zip", "23.01"),
        r("VLC media player", "VideoLAN.VLC", "3.0.21"),
    ])
}
