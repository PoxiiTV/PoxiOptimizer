//! [SIMULACIÓN] Programas de inicio falsos. Estado solo en memoria.

use serde::Serialize;
use std::collections::HashMap;
use std::sync::Mutex;

static DISABLED: Mutex<Option<HashMap<String, bool>>> = Mutex::new(None);

#[derive(Serialize)]
pub struct StartupItem {
    name: String,
    command: String,
    location: String,
    enabled: bool,
}

#[tauri::command(async)]
pub fn list_startup() -> Result<Vec<StartupItem>, String> {
    let guard = DISABLED.lock().unwrap();
    let states = guard.clone().unwrap_or_default();
    let base: &[(&str, &str, &str)] = &[
        ("Discord", "C:\\Users\\Poxi\\AppData\\Local\\Discord\\Update.exe --processStart Discord.exe", "HKCU"),
        ("Steam", "\"C:\\Program Files (x86)\\Steam\\steam.exe\" -silent", "HKLM"),
        ("Spotify", "C:\\Users\\Poxi\\AppData\\Roaming\\Spotify\\Spotify.exe /uri", "HKCU"),
        ("OneDrive", "C:\\Users\\Poxi\\AppData\\Local\\Microsoft\\OneDrive\\OneDrive.exe /background", "HKCU"),
        ("EpicGamesLauncher", "\"C:\\Program Files (x86)\\Epic Games\\Launcher\\Portal\\Binaries\\Win64\\EpicGamesLauncher.exe\"", "HKLM"),
        ("NVIDIA App", "\"C:\\Program Files\\NVIDIA Corporation\\NVIDIA App\\CEF\\NVIDIA App.exe\" --start", "HKLM"),
        ("RtkAudUService", "C:\\Windows\\System32\\DriverStore\\...\\RtkAudUService64.exe", "HKLM"),
    ];
    Ok(base
        .iter()
        .map(|(name, cmd, loc)| {
            let key = format!("{loc}{name}");
            StartupItem {
                name: name.to_string(),
                command: cmd.to_string(),
                location: loc.to_string(),
                enabled: *states.get(&key).unwrap_or(&true),
            }
        })
        .collect())
}

#[tauri::command(async)]
pub fn set_startup(name: String, location: String, enable: bool) -> Result<String, String> {
    let key = format!("{location}{name}");
    DISABLED.lock().unwrap().get_or_insert_with(HashMap::new).insert(key, enable);
    Ok(if enable {
        "[Simulación] Programa habilitado en el inicio".to_string()
    } else {
        "[Simulación] Programa deshabilitado del inicio".to_string()
    })
}
