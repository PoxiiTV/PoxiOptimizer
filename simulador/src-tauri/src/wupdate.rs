//! [SIMULACIÓN] Windows Update falso. Estado guardado solo en memoria.

use std::sync::Mutex;

static MODE: Mutex<Option<String>> = Mutex::new(None);

#[tauri::command(async)]
pub fn get_windows_update_mode() -> Result<String, String> {
    Ok(MODE.lock().unwrap().clone().unwrap_or_else(|| "default".to_string()))
}

#[tauri::command(async)]
pub fn set_windows_update_mode(mode: String) -> Result<String, String> {
    std::thread::sleep(std::time::Duration::from_millis(500));
    *MODE.lock().unwrap() = Some(mode);
    Ok("[Simulación] Modo de Windows Update aplicado".to_string())
}
