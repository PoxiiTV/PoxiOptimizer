//! [SIMULACIÓN] Activación falsa. No descarga ni ejecuta MAS.

#[tauri::command(async)]
pub fn activate_windows() -> Result<String, String> {
    std::thread::sleep(std::time::Duration::from_millis(1500));
    Ok("[Simulación] ¡Windows activado correctamente! ✅".to_string())
}

#[tauri::command(async)]
pub fn activate_office() -> Result<String, String> {
    std::thread::sleep(std::time::Duration::from_millis(1500));
    Ok("[Simulación] Proceso de activación de Office completado. ✅".to_string())
}

#[tauri::command(async)]
pub fn open_mas_menu() -> Result<String, String> {
    Ok("[Simulación] Aquí se abriría el menú completo de MAS.".to_string())
}
