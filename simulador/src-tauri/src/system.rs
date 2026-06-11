//! [SIMULACIÓN] Información del sistema con datos falsos. No lee nada real.

use serde_json::{json, Value};

#[tauri::command(async)]
pub fn get_system_info() -> Result<Value, String> {
    Ok(json!({
        "os_name": "Windows 11 Pro (Simulación)",
        "os_version": "10.0.26100",
        "os_build": "26100",
        "arch": "64 bits",
        "computer_name": "POXI-PC",
        "user_name": "Poxi",
        "cpu": "AMD Ryzen 7 5800X 8-Core Processor",
        "gpu": "NVIDIA GeForce RTX 4070",
        "ram_total": 32.0,
        "ram_used": 11.4,
        "ram_percent": 36,
        "disk_total": 931.5,
        "disk_used": 412.8,
        "disk_free": 518.7,
        "disk_percent": 44,
        "uptime_hours": 7.5
    }))
}

#[tauri::command(async)]
pub fn is_admin() -> bool {
    true
}

#[tauri::command(async)]
pub fn get_activation_status() -> Result<Value, String> {
    Ok(json!({
        "activated": true,
        "edition": "Windows 11 Pro (Simulación)",
        "detail": "Windows activado"
    }))
}

#[tauri::command(async)]
pub fn create_restore_point(_description: String) -> Result<String, String> {
    // Simula un pequeño retardo de creación.
    std::thread::sleep(std::time::Duration::from_millis(900));
    Ok("[Simulación] Punto de restauración creado".to_string())
}
