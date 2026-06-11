//! [SIMULACIÓN] Limpieza falsa. No borra nada; devuelve un resultado de ejemplo.

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct CleanupResult {
    freed_mb: f64,
    details: Vec<String>,
}

#[tauri::command(async)]
pub fn run_cleanup(options: Vec<String>) -> Result<CleanupResult, String> {
    std::thread::sleep(std::time::Duration::from_millis(1200));
    // Espacio "liberado" simulado según las opciones marcadas.
    let labels: &[(&str, &str, f64)] = &[
        ("temp", "Archivos temporales", 842.3),
        ("update_cache", "Caché de Windows Update", 1325.0),
        ("browser_cache", "Caché de navegadores", 612.7),
        ("thumbnails", "Miniaturas (thumbnails)", 96.4),
        ("win_logs", "Logs de Windows", 48.1),
        ("print_queue", "Cola de impresión", 3.2),
        ("recycle_bin", "Papelera de reciclaje", 1580.9),
        ("dns", "Caché DNS", 0.0),
        ("winsxs", "Componentes antiguos (WinSxS)", 2240.0),
    ];
    let mut freed = 0.0;
    let mut details = Vec::new();
    for (key, label, mb) in labels {
        if options.iter().any(|o| o == key) {
            freed += mb;
            details.push(label.to_string());
        }
    }
    Ok(CleanupResult {
        freed_mb: (freed * 10.0).round() / 10.0,
        details,
    })
}
