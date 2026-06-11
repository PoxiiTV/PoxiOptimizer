//! [SIMULACIÓN] Comprobación de actualizaciones falsa.

use serde_json::{json, Value};

#[tauri::command(async)]
pub fn check_update() -> Result<Value, String> {
    std::thread::sleep(std::time::Duration::from_millis(700));
    Ok(json!({
        "update_available": false,
        "current": env!("CARGO_PKG_VERSION"),
        "latest": env!("CARGO_PKG_VERSION"),
        "url": "https://github.com/PoxiiTV/PoxiOptimizer/releases",
        "notes": ""
    }))
}
