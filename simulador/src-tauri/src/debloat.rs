//! [SIMULACIÓN] Lista de apps de la Store falsa. No desinstala nada.

use serde::Serialize;

#[derive(Serialize)]
pub struct AppxItem {
    name: String,
    display: String,
    version: String,
    protected: bool,
    recommended: bool,
}

fn item(name: &str, display: &str, protected: bool, recommended: bool) -> AppxItem {
    AppxItem {
        name: name.to_string(),
        display: display.to_string(),
        version: "1.0.0.0".to_string(),
        protected,
        recommended,
    }
}

#[tauri::command(async)]
pub fn list_appx() -> Result<Vec<AppxItem>, String> {
    Ok(vec![
        item("Microsoft.BingNews", "Noticias (Bing)", false, true),
        item("Microsoft.BingWeather", "El Tiempo (Bing)", false, true),
        item("Microsoft.SkypeApp", "Skype", false, true),
        item("Microsoft.MicrosoftSolitaireCollection", "Solitario", false, true),
        item("Microsoft.WindowsMaps", "Mapas", false, true),
        item("Microsoft.YourPhone", "Vincular al teléfono", false, true),
        item("Microsoft.ZuneMusic", "Groove / Multimedia", false, true),
        item("Microsoft.ZuneVideo", "Películas y TV", false, true),
        item("Microsoft.GamingApp", "Xbox (app)", false, true),
        item("Microsoft.XboxGamingOverlay", "Xbox Game Bar", false, true),
        item("Clipchamp.Clipchamp", "Clipchamp", false, true),
        item("Microsoft.Todos", "Microsoft To Do", false, true),
        item("SpotifyAB.SpotifyMusic", "Spotify", false, true),
        item("king.com.CandyCrushSaga", "Candy Crush Saga", false, true),
        item("Microsoft.MicrosoftStickyNotes", "Notas rápidas", false, false),
        item("Microsoft.Paint", "Paint", true, false),
        item("Microsoft.WindowsNotepad", "Bloc de notas", true, false),
        item("Microsoft.WindowsStore", "Microsoft Store", true, false),
        item("Microsoft.WindowsTerminal", "Terminal", true, false),
        item("Microsoft.SecHealthUI", "Seguridad de Windows", true, false),
    ])
}

#[tauri::command(async)]
pub fn remove_appx(name: String) -> Result<String, String> {
    std::thread::sleep(std::time::Duration::from_millis(400));
    Ok(format!("[Simulación] Eliminado: {name}"))
}
