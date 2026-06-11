//! [SIMULACIÓN] Exportar/importar falso. No abre diálogos ni toca archivos.

#[tauri::command(async)]
pub fn export_config(_json: String) -> Result<String, String> {
    std::thread::sleep(std::time::Duration::from_millis(500));
    Ok("[Simulación] Configuración guardada en: C:\\Users\\Poxi\\Documents\\poxi-optimizer-config.json".to_string())
}

#[tauri::command(async)]
pub fn import_config() -> Result<String, String> {
    std::thread::sleep(std::time::Duration::from_millis(500));
    // Devuelve una configuración de ejemplo (no aplica nada real).
    Ok(r#"{"app":"PoxiOptimizer","version":2,"tweaks":{"telemetry":true,"dark-mode":true}}"#.to_string())
}
