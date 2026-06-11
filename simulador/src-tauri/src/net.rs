//! [SIMULACIÓN] DNS falso. No cambia la configuración de red.

#[tauri::command(async)]
pub fn set_dns(provider: String) -> Result<String, String> {
    std::thread::sleep(std::time::Duration::from_millis(600));
    let label = match provider.as_str() {
        "google" => "Google (8.8.8.8)",
        "cloudflare" => "Cloudflare (1.1.1.1)",
        _ => "automático (DHCP)",
    };
    Ok(format!("[Simulación] DNS configurado: {label}"))
}
