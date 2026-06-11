//! Historial de acciones persistente. Guarda hasta 500 entradas en
//! %APPDATA%\PoxiOptimizer\history.json.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone)]
pub struct LogEntry {
    pub id: String,
    pub timestamp: String,
    pub kind: String,
    pub label: String,
    pub can_undo: bool,
    pub undo_kind: Option<String>,
    pub undo_id: Option<String>,
}

fn history_path() -> Option<PathBuf> {
    let appdata = std::env::var("APPDATA").ok()?;
    let dir = PathBuf::from(appdata).join("PoxiOptimizer");
    std::fs::create_dir_all(&dir).ok()?;
    Some(dir.join("history.json"))
}

fn load_entries() -> Vec<LogEntry> {
    let Some(path) = history_path() else { return vec![] };
    let Ok(data) = std::fs::read_to_string(&path) else { return vec![] };
    serde_json::from_str(&data).unwrap_or_default()
}

#[tauri::command(async)]
pub fn get_action_log() -> Vec<LogEntry> {
    load_entries()
}

#[tauri::command(async)]
pub fn log_action(entry: LogEntry) -> Result<(), String> {
    let path = history_path().ok_or_else(|| "No se pudo obtener la ruta del historial".to_string())?;
    let mut entries = load_entries();
    entries.insert(0, entry);
    if entries.len() > 500 {
        entries.truncate(500);
    }
    let json = serde_json::to_string_pretty(&entries).map_err(|e| e.to_string())?;
    std::fs::write(&path, json).map_err(|e| e.to_string())
}

#[tauri::command(async)]
pub fn clear_action_log() -> Result<(), String> {
    let path = history_path().ok_or_else(|| "No se pudo obtener la ruta".to_string())?;
    std::fs::write(&path, "[]").map_err(|e| e.to_string())
}
