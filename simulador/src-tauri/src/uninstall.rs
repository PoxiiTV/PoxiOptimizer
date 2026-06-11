//! [SIMULACIÓN] Lista de programas falsa. No desinstala nada.

use serde::Serialize;

#[derive(Serialize)]
pub struct Program {
    id: String,
    name: String,
    version: String,
    publisher: String,
    source: String,
}

fn p(name: &str, version: &str, publisher: &str) -> Program {
    Program {
        id: name.replace(' ', ""),
        name: name.to_string(),
        version: version.to_string(),
        publisher: publisher.to_string(),
        source: "HKLM".to_string(),
    }
}

#[tauri::command(async)]
pub fn list_programs() -> Result<Vec<Program>, String> {
    Ok(vec![
        p("Google Chrome", "126.0.6478.127", "Google LLC"),
        p("Mozilla Firefox", "127.0.1", "Mozilla"),
        p("Discord", "1.0.9038", "Discord Inc."),
        p("Steam", "2.10.91.91", "Valve Corporation"),
        p("Spotify", "1.2.40", "Spotify AB"),
        p("Visual Studio Code", "1.90.2", "Microsoft Corporation"),
        p("7-Zip 23.01", "23.01", "Igor Pavlov"),
        p("NVIDIA GeForce Experience", "3.27", "NVIDIA Corporation"),
        p("Microsoft Edge", "126.0.2592.61", "Microsoft Corporation"),
        p("OBS Studio", "30.1.2", "OBS Project"),
        p("VLC media player", "3.0.21", "VideoLAN"),
        p("WinRAR 7.01", "7.01", "win.rar GmbH"),
    ])
}

#[tauri::command(async)]
pub fn uninstall_program(_id: String, _source: String) -> Result<String, String> {
    std::thread::sleep(std::time::Duration::from_millis(700));
    Ok("[Simulación] Desinstalación completada".to_string())
}
