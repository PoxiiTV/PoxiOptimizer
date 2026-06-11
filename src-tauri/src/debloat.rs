//! Gestion de aplicaciones de la Microsoft Store (paquetes Appx): listado y
//! eliminacion segura de bloatware.
//!
//! Seguridad: existe una lista de paquetes PROTEGIDOS que jamas se eliminan
//! porque romperian el menu Inicio, la tienda, la seguridad o el shell.

use crate::ps;
use serde::Serialize;
use serde_json::Value;

/// Paquetes que NUNCA deben eliminarse (romperian Windows).
const PROTECTED: &[&str] = &[
    "Microsoft.WindowsStore",
    "Microsoft.StorePurchaseApp",
    "Microsoft.DesktopAppInstaller", // winget
    "Microsoft.WindowsTerminal",
    "Microsoft.SecHealthUI",
    "Microsoft.Windows.SecHealthUI",
    "Microsoft.Windows.ShellExperienceHost",
    "Microsoft.WindowsShellExperienceHost",
    "Microsoft.Windows.StartMenuExperienceHost",
    "Microsoft.Windows.CloudExperienceHost",
    "Microsoft.Windows.ContentDeliveryManager",
    "Microsoft.Windows.Search",
    "Microsoft.AAD.BrokerPlugin",
    "Microsoft.AccountsControl",
    "Microsoft.LockApp",
    "Microsoft.Windows.PeopleExperienceHost",
    "Microsoft.Windows.NarratorQuickStart",
    "Microsoft.UI.Xaml",
    "Microsoft.VCLibs",
    "Microsoft.NET",
    "Microsoft.Services.Store.Engagement",
    "Microsoft.WindowsAppRuntime",
    "MicrosoftWindows.Client",
    "Microsoft.Windows.Photos", // util, no bloat
    "windows.immersivecontrolpanel",
    "Microsoft.Windows.OOBENetworkConnectionFlow",
    "Microsoft.WindowsNotepad",
    "Microsoft.Paint",
];

/// Paquetes considerados bloatware, preseleccionados para eliminar.
const BLOAT: &[&str] = &[
    "Microsoft.3DBuilder",
    "Microsoft.BingNews",
    "Microsoft.BingWeather",
    "Microsoft.BingFinance",
    "Microsoft.BingSports",
    "Microsoft.GetHelp",
    "Microsoft.Getstarted",
    "Microsoft.MicrosoftOfficeHub",
    "Microsoft.MicrosoftSolitaireCollection",
    "Microsoft.MixedReality.Portal",
    "Microsoft.People",
    "Microsoft.SkypeApp",
    "Microsoft.WindowsAlarms",
    "Microsoft.WindowsFeedbackHub",
    "Microsoft.WindowsMaps",
    "Microsoft.windowscommunicationsapps", // Mail & Calendar
    "Microsoft.YourPhone",
    "Microsoft.ZuneMusic",
    "Microsoft.ZuneVideo",
    "Microsoft.PowerAutomateDesktop",
    "Microsoft.Todos",
    "MicrosoftTeams",
    "MSTeams",
    "Microsoft.Copilot",
    "Microsoft.Windows.Copilot",
    "Microsoft.549981C3F5F10", // Cortana
    "Clipchamp.Clipchamp",
    "Microsoft.OutlookForWindows",
    "Microsoft.MicrosoftStickyNotes",
    "Microsoft.GamingApp",
    "Microsoft.Xbox.TCUI",
    "Microsoft.XboxGameOverlay",
    "Microsoft.XboxGamingOverlay",
    "Microsoft.XboxIdentityProvider",
    "Microsoft.XboxSpeechToTextOverlay",
    "SpotifyAB.SpotifyMusic",
    "Disney.37853FC22B2CE",
    "BytedancePte.Ltd.TikTok",
    "Facebook.Facebook",
    "king.com.CandyCrushSaga",
    "king.com.CandyCrushSodaSaga",
    "Microsoft.Advertising.Xaml",
];

#[derive(Serialize)]
pub struct AppxItem {
    name: String,
    display: String,
    version: String,
    protected: bool,
    recommended: bool,
}

fn is_protected(name: &str) -> bool {
    PROTECTED.iter().any(|p| name.starts_with(p))
}

fn is_bloat(name: &str) -> bool {
    BLOAT.iter().any(|b| name.eq_ignore_ascii_case(b))
}

/// Convierte un Name de paquete en una etiqueta legible.
fn friendly(name: &str) -> String {
    let known: &[(&str, &str)] = &[
        ("Microsoft.BingNews", "Noticias (Bing)"),
        ("Microsoft.BingWeather", "El Tiempo (Bing)"),
        ("Microsoft.GetHelp", "Obtener ayuda"),
        ("Microsoft.Getstarted", "Sugerencias / Consejos"),
        ("Microsoft.MicrosoftOfficeHub", "Office Hub"),
        ("Microsoft.MicrosoftSolitaireCollection", "Solitario"),
        ("Microsoft.People", "Contactos (People)"),
        ("Microsoft.SkypeApp", "Skype"),
        ("Microsoft.WindowsAlarms", "Alarmas y reloj"),
        ("Microsoft.WindowsFeedbackHub", "Centro de opiniones"),
        ("Microsoft.WindowsMaps", "Mapas"),
        ("Microsoft.windowscommunicationsapps", "Correo y Calendario"),
        ("Microsoft.YourPhone", "Vincular al telefono"),
        ("Microsoft.ZuneMusic", "Groove / Reproductor multimedia"),
        ("Microsoft.ZuneVideo", "Peliculas y TV"),
        ("Microsoft.PowerAutomateDesktop", "Power Automate"),
        ("Microsoft.Todos", "Microsoft To Do"),
        ("MicrosoftTeams", "Microsoft Teams (personal)"),
        ("MSTeams", "Microsoft Teams"),
        ("Microsoft.Copilot", "Copilot"),
        ("Microsoft.549981C3F5F10", "Cortana"),
        ("Clipchamp.Clipchamp", "Clipchamp"),
        ("Microsoft.OutlookForWindows", "Nuevo Outlook"),
        ("Microsoft.MicrosoftStickyNotes", "Notas rapidas"),
        ("Microsoft.GamingApp", "Xbox (app)"),
        ("Microsoft.XboxGamingOverlay", "Xbox Game Bar"),
        ("SpotifyAB.SpotifyMusic", "Spotify"),
        ("king.com.CandyCrushSaga", "Candy Crush Saga"),
    ];
    if let Some((_, label)) = known.iter().find(|(k, _)| name.eq_ignore_ascii_case(k)) {
        return label.to_string();
    }
    // Derivamos un nombre legible quitando el prefijo del publisher.
    name.rsplit('.').next().unwrap_or(name).to_string()
}

/// Lista los paquetes Appx instalados para el usuario actual.
#[tauri::command(async)]
pub fn list_appx() -> Result<Vec<AppxItem>, String> {
    let script = r#"
$ErrorActionPreference='SilentlyContinue'
Get-AppxPackage | Where-Object { -not $_.IsFramework -and $_.SignatureKind -ne 'System' -or $_.Name -like 'Microsoft.*' } |
  Where-Object { -not $_.IsFramework } |
  Select-Object Name, Version | Sort-Object Name -Unique | ConvertTo-Json -Compress
"#;
    let out = ps::ps_capture(script)?;
    if out.is_empty() {
        return Ok(vec![]);
    }
    // PowerShell devuelve un objeto suelto si solo hay uno; normalizamos.
    let parsed: Value = serde_json::from_str(&out)
        .map_err(|e| format!("No se pudo leer la lista de apps: {e}"))?;
    let arr = match parsed {
        Value::Array(a) => a,
        other => vec![other],
    };
    let mut items: Vec<AppxItem> = arr
        .into_iter()
        .filter_map(|v| {
            let name = v.get("Name")?.as_str()?.to_string();
            let version = v
                .get("Version")
                .and_then(|x| x.as_str())
                .unwrap_or("")
                .to_string();
            Some(AppxItem {
                display: friendly(&name),
                protected: is_protected(&name),
                recommended: is_bloat(&name),
                name,
                version,
            })
        })
        .collect();
    items.sort_by(|a, b| {
        b.recommended
            .cmp(&a.recommended)
            .then(a.display.to_lowercase().cmp(&b.display.to_lowercase()))
    });
    Ok(items)
}

/// Elimina un paquete Appx para el usuario actual y su version aprovisionada
/// (para que no vuelva a instalarse en cuentas nuevas). Rechaza paquetes
/// protegidos por seguridad.
#[tauri::command(async)]
pub fn remove_appx(name: String) -> Result<String, String> {
    if is_protected(&name) {
        return Err(format!(
            "'{}' es un componente protegido del sistema y no puede eliminarse.",
            friendly(&name)
        ));
    }
    let safe = name.replace('\'', "");
    let script = format!(
        r#"
$ErrorActionPreference='SilentlyContinue'
Get-AppxPackage -Name '{n}' | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxProvisionedPackage -Online | Where-Object {{ $_.DisplayName -eq '{n}' }} | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue | Out-Null
'OK'
"#,
        n = safe
    );
    ps::ps_capture(&script).map(|_| format!("Eliminado: {}", friendly(&name)))
}

/// Paquetes que el modo Post-Formateo MANTIENE aunque sean "bloatware":
/// la app de Xbox y el proveedor de identidad (necesario para juegos / Game Pass).
const POSTFORMAT_KEEP: &[&str] = &["Microsoft.GamingApp", "Microsoft.XboxIdentityProvider"];

/// [POST-FORMATEO] Quita de golpe todo el bloatware conocido excepto la lista
/// que se desea conservar (Xbox). La Microsoft Store, Edge, Bloc de notas y los
/// componentes esenciales NO se tocan porque no están en la lista de bloatware.
/// Devuelve los nombres de los paquetes eliminados.
#[tauri::command(async)]
pub fn postformat_debloat() -> Result<Vec<String>, String> {
    let names: Vec<&str> = BLOAT
        .iter()
        .filter(|n| !POSTFORMAT_KEEP.contains(n))
        .copied()
        .collect();
    let list = names.join("','");
    let script = format!(
        r#"
$ErrorActionPreference='SilentlyContinue'
$names = @('{list}')
$removed = @()
foreach ($n in $names) {{
  $pkg = Get-AppxPackage -Name $n
  if ($pkg) {{
    $pkg | Remove-AppxPackage -ErrorAction SilentlyContinue
    Get-AppxProvisionedPackage -Online | Where-Object {{ $_.DisplayName -eq $n }} | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue | Out-Null
    $removed += $n
  }}
}}
$removed -join ','
"#,
        list = list
    );
    let out = ps::ps_capture(&script)?;
    let removed: Vec<String> = out
        .split(',')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(friendly)
        .collect();
    Ok(removed)
}
