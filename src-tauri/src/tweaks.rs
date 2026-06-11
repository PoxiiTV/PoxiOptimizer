//! Catalogo de optimizaciones (tweaks) para Windows.
//!
//! Filosofia de diseno: TODO tweak es reversible y conocido. No incluimos nada
//! experimental que pueda dejar el sistema inestable. Cada tweak define:
//!   - como aplicarse (apply)
//!   - como revertirse al estado por defecto (revert)
//!   - una expresion PowerShell booleana para detectar si esta aplicado (check)
//!
//! Los comandos viven en el backend (no en el frontend) por seguridad: la UI
//! solo envia identificadores, nunca scripts arbitrarios.

use crate::ps;
use serde::Serialize;
use serde_json::Value;

/// Tipo de dato de una entrada de registro.
#[derive(Clone, Copy)]
enum RegKind {
    Dword,
    Sz,
}

/// Una entrada de registro que forma parte de un tweak.
struct RegEntry {
    path: &'static str,
    name: &'static str,
    kind: RegKind,
    /// Valor cuando el tweak esta APLICADO.
    on: &'static str,
    /// Valor por defecto al que se vuelve al REVERTIR. None = eliminar el valor.
    off: Option<&'static str>,
}

fn reg(
    path: &'static str,
    name: &'static str,
    kind: RegKind,
    on: &'static str,
    off: Option<&'static str>,
) -> RegEntry {
    RegEntry {
        path,
        name,
        kind,
        on,
        off,
    }
}

enum Action {
    /// Tweak basado puramente en entradas de registro (apply/revert/check auto).
    Registry(Vec<RegEntry>),
    /// Tweak con scripts a medida (servicios, powercfg, etc.).
    Script {
        apply: &'static str,
        revert: &'static str,
        /// Expresion PowerShell que evalua a $true si esta aplicado.
        check: &'static str,
    },
}

struct Tweak {
    id: &'static str,
    category: &'static str,
    title: &'static str,
    description: &'static str,
    /// Si es true, se recomienda dejarlo activado (preseleccionado en "1-click").
    recommended: bool,
    action: Action,
}

#[derive(Serialize)]
pub struct TweakMeta {
    id: String,
    category: String,
    title: String,
    description: String,
    recommended: bool,
    /// Tweaks avanzados que pueden reducir seguridad/estabilidad (categoría Avanzado).
    risky: bool,
}

// ---------------------------------------------------------------------------
// Generacion de scripts para tweaks de registro
// ---------------------------------------------------------------------------

fn ps_set(entry: &RegEntry) -> String {
    let (prop, valexpr) = match entry.kind {
        RegKind::Dword => ("DWord", entry.on.to_string()),
        RegKind::Sz => ("String", format!("'{}'", entry.on)),
    };
    format!(
        "if (-not (Test-Path '{p}')) {{ New-Item -Path '{p}' -Force | Out-Null }}; New-ItemProperty -Path '{p}' -Name '{n}' -Value {v} -PropertyType {t} -Force | Out-Null;",
        p = entry.path,
        n = entry.name,
        v = valexpr,
        t = prop
    )
}

fn ps_revert(entry: &RegEntry) -> String {
    match entry.off {
        Some(off) => {
            let (prop, valexpr) = match entry.kind {
                RegKind::Dword => ("DWord", off.to_string()),
                RegKind::Sz => ("String", format!("'{}'", off)),
            };
            format!(
                "if (-not (Test-Path '{p}')) {{ New-Item -Path '{p}' -Force | Out-Null }}; New-ItemProperty -Path '{p}' -Name '{n}' -Value {v} -PropertyType {t} -Force | Out-Null;",
                p = entry.path,
                n = entry.name,
                v = valexpr,
                t = prop
            )
        }
        None => format!(
            "Remove-ItemProperty -Path '{p}' -Name '{n}' -ErrorAction SilentlyContinue;",
            p = entry.path,
            n = entry.name
        ),
    }
}

fn reg_check_expr(entries: &[RegEntry]) -> String {
    let parts: Vec<String> = entries
        .iter()
        .map(|e| {
            let cmp = match e.kind {
                RegKind::Dword => format!("{}", e.on),
                RegKind::Sz => format!("'{}'", e.on),
            };
            format!(
                "((Get-ItemProperty -Path '{p}' -Name '{n}' -ErrorAction SilentlyContinue).'{n}' -eq {c})",
                p = e.path,
                n = e.name,
                c = cmp
            )
        })
        .collect();
    parts.join(" -and ")
}

fn apply_script(tw: &Tweak) -> String {
    match &tw.action {
        Action::Registry(entries) => entries.iter().map(ps_set).collect::<Vec<_>>().join("\n"),
        Action::Script { apply, .. } => apply.to_string(),
    }
}

fn revert_script(tw: &Tweak) -> String {
    match &tw.action {
        Action::Registry(entries) => entries.iter().map(ps_revert).collect::<Vec<_>>().join("\n"),
        Action::Script { revert, .. } => revert.to_string(),
    }
}

fn check_expr(tw: &Tweak) -> String {
    match &tw.action {
        Action::Registry(entries) => reg_check_expr(entries),
        Action::Script { check, .. } => check.to_string(),
    }
}

// ---------------------------------------------------------------------------
// CATALOGO
// ---------------------------------------------------------------------------

// Rutas largas reutilizadas.
const CONTENT_DELIVERY: &str =
    r"HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager";
const ADVERTISING: &str =
    r"HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\AdvertisingInfo";
const EXPLORER_ADV: &str =
    r"HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced";
const SEARCH_SETTINGS: &str = r"HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Search";

fn catalog() -> Vec<Tweak> {
    vec![
        // ----------------------- PRIVACIDAD -----------------------
        Tweak {
            id: "telemetry",
            category: "Privacidad",
            title: "Desactivar telemetria y DiagTrack",
            description: "Reduce al minimo la recopilacion de datos de diagnostico y detiene el servicio de seguimiento de Microsoft (DiagTrack).",
            recommended: true,
            action: Action::Script {
                apply: r#"
if (-not (Test-Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection')) { New-Item -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection' -Force | Out-Null }
New-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection' -Name 'AllowTelemetry' -Value 0 -PropertyType DWord -Force | Out-Null
Set-Service -Name 'DiagTrack' -StartupType Disabled -ErrorAction SilentlyContinue
Stop-Service -Name 'DiagTrack' -Force -ErrorAction SilentlyContinue
Set-Service -Name 'dmwappushservice' -StartupType Disabled -ErrorAction SilentlyContinue
Stop-Service -Name 'dmwappushservice' -Force -ErrorAction SilentlyContinue
"#,
                revert: r#"
Remove-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection' -Name 'AllowTelemetry' -ErrorAction SilentlyContinue
Set-Service -Name 'DiagTrack' -StartupType Automatic -ErrorAction SilentlyContinue
Set-Service -Name 'dmwappushservice' -StartupType Manual -ErrorAction SilentlyContinue
"#,
                check: "((Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection' -Name 'AllowTelemetry' -ErrorAction SilentlyContinue).'AllowTelemetry' -eq 0)",
            },
        },
        Tweak {
            id: "advertising-id",
            category: "Privacidad",
            title: "Desactivar ID de publicidad",
            description: "Impide que las apps usen tu ID de publicidad para mostrarte anuncios personalizados.",
            recommended: true,
            action: Action::Registry(vec![reg(ADVERTISING, "Enabled", RegKind::Dword, "0", Some("1"))]),
        },
        Tweak {
            id: "activity-history",
            category: "Privacidad",
            title: "Desactivar historial de actividad",
            description: "Evita que Windows registre y envie tu historial de actividades (Timeline).",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKLM:\SOFTWARE\Policies\Microsoft\Windows\System", "EnableActivityFeed", RegKind::Dword, "0", None),
                reg(r"HKLM:\SOFTWARE\Policies\Microsoft\Windows\System", "PublishUserActivities", RegKind::Dword, "0", None),
            ]),
        },
        Tweak {
            id: "location-tracking",
            category: "Privacidad",
            title: "Desactivar seguimiento de ubicacion",
            description: "Deniega el acceso a la ubicacion del sistema por privacidad.",
            recommended: false,
            action: Action::Registry(vec![
                reg(r"HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location", "Value", RegKind::Sz, "Deny", Some("Allow")),
            ]),
        },
        Tweak {
            id: "tailored-experiences",
            category: "Privacidad",
            title: "Desactivar experiencias personalizadas",
            description: "Evita que Windows use tus datos de diagnostico para mostrarte sugerencias y anuncios adaptados.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Privacy", "TailoredExperiencesWithDiagnosticDataEnabled", RegKind::Dword, "0", Some("1")),
            ]),
        },
        Tweak {
            id: "suggested-content",
            category: "Privacidad",
            title: "Desactivar contenido y apps sugeridas",
            description: "Quita las sugerencias de apps, anuncios y 'consejos' en el menu Inicio y la configuracion.",
            recommended: true,
            action: Action::Registry(vec![
                reg(CONTENT_DELIVERY, "SubscribedContent-338388Enabled", RegKind::Dword, "0", Some("1")),
                reg(CONTENT_DELIVERY, "SubscribedContent-338389Enabled", RegKind::Dword, "0", Some("1")),
                reg(CONTENT_DELIVERY, "SubscribedContent-353698Enabled", RegKind::Dword, "0", Some("1")),
                reg(CONTENT_DELIVERY, "SystemPaneSuggestionsEnabled", RegKind::Dword, "0", Some("1")),
                reg(CONTENT_DELIVERY, "SilentInstalledAppsEnabled", RegKind::Dword, "0", Some("1")),
            ]),
        },
        Tweak {
            id: "feedback",
            category: "Privacidad",
            title: "Desactivar solicitudes de comentarios",
            description: "Windows dejara de pedirte feedback periodicamente.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKCU:\SOFTWARE\Microsoft\Siuf\Rules", "NumberOfSIUFInPeriod", RegKind::Dword, "0", None),
            ]),
        },
        // ----------------------- RENDIMIENTO -----------------------
        Tweak {
            id: "gamebar-dvr",
            category: "Rendimiento",
            title: "Desactivar Game DVR / grabacion en segundo plano",
            description: "Desactiva la grabacion en segundo plano de la Game Bar, que consume CPU/GPU en juegos.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKCU:\System\GameConfigStore", "GameDVR_Enabled", RegKind::Dword, "0", Some("1")),
                reg(r"HKLM:\SOFTWARE\Policies\Microsoft\Windows\GameDVR", "AllowGameDVR", RegKind::Dword, "0", None),
            ]),
        },
        Tweak {
            id: "game-mode",
            category: "Rendimiento",
            title: "Activar modo de juego",
            description: "Prioriza recursos para los juegos cuando estan en primer plano.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKCU:\SOFTWARE\Microsoft\GameBar", "AutoGameModeEnabled", RegKind::Dword, "1", Some("1")),
                reg(r"HKCU:\SOFTWARE\Microsoft\GameBar", "AllowAutoGameMode", RegKind::Dword, "1", Some("1")),
            ]),
        },
        Tweak {
            id: "hibernation",
            category: "Rendimiento",
            title: "Desactivar hibernacion",
            description: "Libera espacio en disco (hiberfil.sys) y desactiva la hibernacion. Recomendado en equipos de sobremesa con SSD.",
            recommended: false,
            action: Action::Script {
                apply: "powercfg /hibernate off",
                revert: "powercfg /hibernate on",
                check: "((Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Power' -Name 'HibernateEnabled' -ErrorAction SilentlyContinue).'HibernateEnabled' -eq 0)",
            },
        },
        Tweak {
            id: "sysmain",
            category: "Rendimiento",
            title: "Optimizar SysMain (Superfetch)",
            description: "Pone SysMain en modo manual. Util en SSDs donde el precargado aporta poco y genera actividad de disco.",
            recommended: false,
            action: Action::Script {
                apply: "Set-Service -Name 'SysMain' -StartupType Manual -ErrorAction SilentlyContinue; Stop-Service -Name 'SysMain' -Force -ErrorAction SilentlyContinue",
                revert: "Set-Service -Name 'SysMain' -StartupType Automatic -ErrorAction SilentlyContinue; Start-Service -Name 'SysMain' -ErrorAction SilentlyContinue",
                check: "((Get-Service -Name 'SysMain' -ErrorAction SilentlyContinue).StartType -eq 'Manual')",
            },
        },
        Tweak {
            id: "background-apps",
            category: "Rendimiento",
            title: "Desactivar apps en segundo plano",
            description: "Impide que las apps de la Store se ejecuten en segundo plano consumiendo recursos.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications", "GlobalUserDisabled", RegKind::Dword, "1", Some("0")),
            ]),
        },
        Tweak {
            id: "startup-delay",
            category: "Rendimiento",
            title: "Eliminar retardo de inicio de programas",
            description: "Quita el retardo artificial que Windows aplica a los programas de inicio.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Serialize", "StartupDelayInMSec", RegKind::Dword, "0", None),
            ]),
        },
        Tweak {
            id: "menu-show-delay",
            category: "Rendimiento",
            title: "Acelerar animacion de menus",
            description: "Reduce el retardo de apertura de menus para una respuesta mas agil.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKCU:\Control Panel\Desktop", "MenuShowDelay", RegKind::Sz, "100", Some("400")),
            ]),
        },
        // ----------------------- RED -----------------------
        Tweak {
            id: "network-throttling",
            category: "Red",
            title: "Desactivar limitacion de red (throttling)",
            description: "Elimina el limite de procesamiento de paquetes de red, mejorando la latencia en juegos y descargas.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile", "NetworkThrottlingIndex", RegKind::Dword, "4294967295", Some("10")),
            ]),
        },
        Tweak {
            id: "nagle",
            category: "Red",
            title: "Desactivar algoritmo de Nagle",
            description: "Reduce la latencia de red agrupando menos los paquetes pequenos. Beneficioso para juegos online.",
            recommended: false,
            action: Action::Script {
                apply: r#"
$base = 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces'
Get-ChildItem $base | ForEach-Object {
  New-ItemProperty -Path $_.PSPath -Name 'TcpAckFrequency' -Value 1 -PropertyType DWord -Force | Out-Null
  New-ItemProperty -Path $_.PSPath -Name 'TCPNoDelay' -Value 1 -PropertyType DWord -Force | Out-Null
}
"#,
                revert: r#"
$base = 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces'
Get-ChildItem $base | ForEach-Object {
  Remove-ItemProperty -Path $_.PSPath -Name 'TcpAckFrequency' -ErrorAction SilentlyContinue
  Remove-ItemProperty -Path $_.PSPath -Name 'TCPNoDelay' -ErrorAction SilentlyContinue
}
"#,
                check: r#"
$base = 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces'
$all = Get-ChildItem $base
$set = $all | Where-Object { (Get-ItemProperty -Path $_.PSPath -Name 'TcpAckFrequency' -ErrorAction SilentlyContinue).'TcpAckFrequency' -eq 1 }
($all.Count -gt 0 -and $set.Count -eq $all.Count)
"#,
            },
        },
        // ----------------------- INTERFAZ -----------------------
        Tweak {
            id: "dark-mode",
            category: "Interfaz",
            title: "Activar modo oscuro",
            description: "Aplica el tema oscuro a Windows y a las aplicaciones.",
            recommended: false,
            action: Action::Registry(vec![
                reg(r"HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize", "AppsUseLightTheme", RegKind::Dword, "0", Some("1")),
                reg(r"HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize", "SystemUsesLightTheme", RegKind::Dword, "0", Some("1")),
            ]),
        },
        Tweak {
            id: "show-file-extensions",
            category: "Interfaz",
            title: "Mostrar extensiones de archivo",
            description: "Muestra las extensiones (.txt, .exe...) en el Explorador. Recomendado por seguridad.",
            recommended: true,
            action: Action::Registry(vec![reg(EXPLORER_ADV, "HideFileExt", RegKind::Dword, "0", Some("1"))]),
        },
        Tweak {
            id: "taskbar-align-left",
            category: "Interfaz",
            title: "Alinear barra de tareas a la izquierda",
            description: "Mueve los iconos de la barra de tareas a la izquierda (estilo clasico) en Windows 11.",
            recommended: false,
            action: Action::Registry(vec![reg(EXPLORER_ADV, "TaskbarAl", RegKind::Dword, "0", Some("1"))]),
        },
        Tweak {
            id: "taskbar-widgets",
            category: "Interfaz",
            title: "Quitar boton de Widgets",
            description: "Elimina el boton de Widgets de la barra de tareas de Windows 11.",
            recommended: true,
            action: Action::Registry(vec![reg(EXPLORER_ADV, "TaskbarDa", RegKind::Dword, "0", Some("1"))]),
        },
        Tweak {
            id: "taskbar-chat",
            category: "Interfaz",
            title: "Quitar boton de Chat (Teams)",
            description: "Elimina el icono de Chat/Teams de la barra de tareas.",
            recommended: true,
            action: Action::Registry(vec![reg(EXPLORER_ADV, "TaskbarMn", RegKind::Dword, "0", Some("1"))]),
        },
        Tweak {
            id: "bing-search",
            category: "Interfaz",
            title: "Quitar busqueda web de Bing del menu Inicio",
            description: "El buscador del menu Inicio dejara de mostrar resultados web de Bing, acelerando la busqueda local.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKCU:\SOFTWARE\Policies\Microsoft\Windows\Explorer", "DisableSearchBoxSuggestions", RegKind::Dword, "1", None),
                reg(SEARCH_SETTINGS, "BingSearchEnabled", RegKind::Dword, "0", Some("1")),
            ]),
        },
        Tweak {
            id: "classic-context-menu",
            category: "Interfaz",
            title: "Restaurar menu contextual clasico (Win11)",
            description: "Devuelve el menu de clic derecho completo de Windows 10, sin el 'Mostrar mas opciones'.",
            recommended: false,
            action: Action::Script {
                apply: r#"New-Item -Path 'HKCU:\SOFTWARE\CLASSES\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32' -Force | Out-Null; Set-ItemProperty -Path 'HKCU:\SOFTWARE\CLASSES\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32' -Name '(Default)' -Value '' "#,
                revert: r#"Remove-Item -Path 'HKCU:\SOFTWARE\CLASSES\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}' -Recurse -Force -ErrorAction SilentlyContinue"#,
                check: r#"(Test-Path 'HKCU:\SOFTWARE\CLASSES\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32')"#,
            },
        },
        Tweak {
            id: "end-task-taskbar",
            category: "Interfaz",
            title: "Activar 'Finalizar tarea' en la barra de tareas",
            description: "Anade la opcion de finalizar tarea al clic derecho sobre apps en la barra de tareas.",
            recommended: false,
            action: Action::Registry(vec![
                reg(r"HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced\TaskbarDeveloperSettings", "TaskbarEndTask", RegKind::Dword, "1", Some("0")),
            ]),
        },
        // ----------------------- SISTEMA -----------------------
        Tweak {
            id: "verbose-status",
            category: "Sistema",
            title: "Mensajes detallados de inicio/apagado",
            description: "Muestra que esta haciendo Windows al iniciar y apagar, util para diagnosticar bloqueos.",
            recommended: false,
            action: Action::Registry(vec![
                reg(r"HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System", "VerboseStatus", RegKind::Dword, "1", None),
            ]),
        },
        Tweak {
            id: "lockscreen-tips",
            category: "Sistema",
            title: "Quitar anuncios y consejos de la pantalla de bloqueo",
            description: "Desactiva Windows Spotlight y los 'datos curiosos' de la pantalla de bloqueo.",
            recommended: true,
            action: Action::Registry(vec![
                reg(CONTENT_DELIVERY, "RotatingLockScreenOverlayEnabled", RegKind::Dword, "0", Some("1")),
                reg(CONTENT_DELIVERY, "SubscribedContent-338387Enabled", RegKind::Dword, "0", Some("1")),
            ]),
        },
        Tweak {
            id: "widgets-news",
            category: "Sistema",
            title: "Desactivar noticias e intereses",
            description: "Desactiva el feed de noticias e intereses de los widgets.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKLM:\SOFTWARE\Policies\Microsoft\Dsh", "AllowNewsAndInterests", RegKind::Dword, "0", Some("1")),
            ]),
        },
        // ----------------------- PRIVACIDAD (nuevos) -----------------------
        Tweak {
            id: "consumer-features",
            category: "Privacidad",
            title: "Desactivar instalación automática de apps sugeridas",
            description: "Impide que Windows instale apps de la Store en segundo plano sin pedirte permiso (Consumer Features).",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKLM:\SOFTWARE\Policies\Microsoft\Windows\CloudContent", "DisableWindowsConsumerFeatures", RegKind::Dword, "1", None),
            ]),
        },
        Tweak {
            id: "delivery-optimization",
            category: "Privacidad",
            title: "Desactivar Optimización de entrega (P2P de actualizaciones)",
            description: "Evita que Windows comparta actualizaciones con otros PCs de Internet usando tu ancho de banda.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKLM:\SOFTWARE\Policies\Microsoft\Windows\DeliveryOptimization", "DODownloadMode", RegKind::Dword, "0", None),
            ]),
        },
        Tweak {
            id: "windows-ai",
            category: "Privacidad",
            title: "Desactivar Windows AI (Copilot y Recall)",
            description: "Desactiva el botón de Copilot, el servicio de IA y la función Recall. Ahorra RAM y mejora la privacidad.",
            recommended: true,
            action: Action::Script {
                apply: r#"
if (-not (Test-Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsCopilot')) { New-Item -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsCopilot' -Force | Out-Null }
New-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsCopilot' -Name 'TurnOffWindowsCopilot' -Value 1 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'ShowCopilotButton' -Value 0 -PropertyType DWord -Force | Out-Null
if (-not (Test-Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI')) { New-Item -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI' -Force | Out-Null }
New-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI' -Name 'DisableAIDataAnalysis' -Value 1 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI' -Name 'AllowRecallEnablement' -Value 0 -PropertyType DWord -Force | Out-Null
Set-Service -Name 'WSAIFabricSvc' -StartupType Disabled -ErrorAction SilentlyContinue
Stop-Service -Name 'WSAIFabricSvc' -Force -ErrorAction SilentlyContinue
"#,
                revert: r#"
Remove-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsCopilot' -Name 'TurnOffWindowsCopilot' -ErrorAction SilentlyContinue
Remove-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'ShowCopilotButton' -ErrorAction SilentlyContinue
Remove-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI' -Name 'DisableAIDataAnalysis' -ErrorAction SilentlyContinue
Remove-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI' -Name 'AllowRecallEnablement' -ErrorAction SilentlyContinue
Set-Service -Name 'WSAIFabricSvc' -StartupType Automatic -ErrorAction SilentlyContinue
"#,
                check: "((Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsCopilot' -Name 'TurnOffWindowsCopilot' -ErrorAction SilentlyContinue).'TurnOffWindowsCopilot' -eq 1)",
            },
        },
        Tweak {
            id: "powershell-telemetry",
            category: "Privacidad",
            title: "Desactivar telemetría de PowerShell 7",
            description: "Establece la variable de entorno del sistema para que PowerShell 7 no envíe datos de uso a Microsoft.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Environment", "POWERSHELL_TELEMETRY_OPTOUT", RegKind::Sz, "1", None),
            ]),
        },
        Tweak {
            id: "start-recommendations",
            category: "Privacidad",
            title: "Quitar sección Recomendado del menú Inicio",
            description: "Oculta los archivos y apps recomendados del menú Inicio de Windows 11.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKLM:\SOFTWARE\Policies\Microsoft\Windows\Explorer", "HideRecommendedSection", RegKind::Dword, "1", None),
            ]),
        },
        Tweak {
            id: "cortana",
            category: "Privacidad",
            title: "Desactivar Cortana",
            description: "Deshabilita el asistente Cortana y su búsqueda web integrada.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Search", "AllowCortana", RegKind::Dword, "0", None),
                reg(r"HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Search", "DisableWebSearch", RegKind::Dword, "1", None),
            ]),
        },
        // ----------------------- RENDIMIENTO (nuevos) -----------------------
        Tweak {
            id: "fullscreen-optimizations",
            category: "Rendimiento",
            title: "Desactivar optimizaciones de pantalla completa (FSO)",
            description: "Mejora la fluidez y latencia en juegos a pantalla completa desactivando la capa de compatibilidad FSO. Muy recomendado para gaming.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKCU:\System\GameConfigStore", "GameDVR_DXGIHonorFSEWindowsCompatible", RegKind::Dword, "1", Some("0")),
                reg(r"HKCU:\System\GameConfigStore", "GameDVR_FSEBehaviorMode", RegKind::Dword, "2", None),
                reg(r"HKCU:\System\GameConfigStore", "GameDVR_HonorUserFSEBehaviorMode", RegKind::Dword, "1", Some("0")),
            ]),
        },
        Tweak {
            id: "visual-effects-performance",
            category: "Rendimiento",
            title: "Efectos visuales → Mejor rendimiento",
            description: "Desactiva animaciones, sombras y transparencias para liberar CPU/GPU. Interfaz más rápida a costa de aspecto más básico.",
            recommended: false,
            action: Action::Script {
                apply: r#"
$vizPath = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects'
if (-not (Test-Path $vizPath)) { New-Item -Path $vizPath -Force | Out-Null }
New-ItemProperty -Path $vizPath -Name 'VisualFXSetting' -Value 2 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path 'HKCU:\Control Panel\Desktop' -Name 'DragFullWindows' -Value '0' -PropertyType String -Force | Out-Null
$wmPath = 'HKCU:\Control Panel\Desktop\WindowMetrics'
if (-not (Test-Path $wmPath)) { New-Item -Path $wmPath -Force | Out-Null }
New-ItemProperty -Path $wmPath -Name 'MinAnimate' -Value '0' -PropertyType String -Force | Out-Null
New-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'ListviewAlphaSelect' -Value 0 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'ListviewShadow' -Value 0 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'TaskbarAnimations' -Value 0 -PropertyType DWord -Force | Out-Null
"#,
                revert: r#"
$vizPath = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects'
if (-not (Test-Path $vizPath)) { New-Item -Path $vizPath -Force | Out-Null }
New-ItemProperty -Path $vizPath -Name 'VisualFXSetting' -Value 1 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path 'HKCU:\Control Panel\Desktop' -Name 'DragFullWindows' -Value '1' -PropertyType String -Force | Out-Null
New-ItemProperty -Path 'HKCU:\Control Panel\Desktop\WindowMetrics' -Name 'MinAnimate' -Value '1' -PropertyType String -Force | Out-Null
New-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'ListviewAlphaSelect' -Value 1 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'ListviewShadow' -Value 1 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'TaskbarAnimations' -Value 1 -PropertyType DWord -Force | Out-Null
"#,
                check: "((Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects' -Name 'VisualFXSetting' -ErrorAction SilentlyContinue).'VisualFXSetting' -eq 2)",
            },
        },
        Tweak {
            id: "mouse-acceleration",
            category: "Rendimiento",
            title: "Desactivar aceleración del ratón",
            description: "Movimiento 1:1 del ratón sin curva de aceleración. Esencial para gaming y para precisión en el escritorio.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKCU:\Control Panel\Mouse", "MouseSpeed", RegKind::Sz, "0", Some("1")),
                reg(r"HKCU:\Control Panel\Mouse", "MouseThreshold1", RegKind::Sz, "0", Some("6")),
                reg(r"HKCU:\Control Panel\Mouse", "MouseThreshold2", RegKind::Sz, "0", Some("10")),
            ]),
        },
        Tweak {
            id: "services-manual",
            category: "Rendimiento",
            title: "Servicios no esenciales → Manual",
            description: "Pone en modo manual servicios que no se usan en la mayoría de PCs: mapas offline, archivos sin conexión y compartición de conexión. Libera RAM.",
            recommended: false,
            action: Action::Script {
                apply: r#"
$svcs = @('CscService','MapsBroker','SharedAccess','PhoneSvc')
foreach ($s in $svcs) {
    if (Get-Service -Name $s -ErrorAction SilentlyContinue) {
        Set-Service -Name $s -StartupType Manual -ErrorAction SilentlyContinue
        Stop-Service -Name $s -Force -ErrorAction SilentlyContinue
    }
}
$ram = [int]((Get-CimInstance Win32_ComputerSystem -ErrorAction SilentlyContinue).TotalPhysicalMemory / 1KB)
if ($ram -gt 0) { New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control' -Name 'SvcHostSplitThresholdInKB' -Value $ram -PropertyType DWord -Force | Out-Null }
"#,
                revert: r#"
$svcs = @('CscService','MapsBroker','SharedAccess','PhoneSvc')
foreach ($s in $svcs) {
    if (Get-Service -Name $s -ErrorAction SilentlyContinue) {
        Set-Service -Name $s -StartupType Automatic -ErrorAction SilentlyContinue
    }
}
New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control' -Name 'SvcHostSplitThresholdInKB' -Value 3670016 -PropertyType DWord -Force | Out-Null
"#,
                check: "((Get-Service -Name 'MapsBroker' -ErrorAction SilentlyContinue).StartType -eq 'Manual')",
            },
        },
        // ----------------------- RED (nuevos) -----------------------
        Tweak {
            id: "teredo-disable",
            category: "Red",
            title: "Desactivar Teredo",
            description: "Desactiva el túnel Teredo (transición IPv4→IPv6). Puede mejorar latencia en juegos online. No afecta a la navegación normal.",
            recommended: true,
            action: Action::Script {
                apply: r#"netsh interface teredo set state disabled 2>$null | Out-Null; New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters' -Name 'DisabledComponents' -Value 1 -PropertyType DWord -Force | Out-Null"#,
                revert: r#"netsh interface teredo set state default 2>$null | Out-Null; Remove-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters' -Name 'DisabledComponents' -ErrorAction SilentlyContinue"#,
                check: "((Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip6\\Parameters' -Name 'DisabledComponents' -ErrorAction SilentlyContinue).'DisabledComponents' -ge 1)",
            },
        },
        Tweak {
            id: "ipv6-disable",
            category: "Red",
            title: "Desactivar IPv6 completamente",
            description: "Deshabilita IPv6 en todos los adaptadores. Puede reducir tiempos de resolución en redes solo IPv4. No recomendado si tu router o ISP usa IPv6.",
            recommended: false,
            action: Action::Script {
                apply: r#"
Disable-NetAdapterBinding -Name "*" -ComponentID ms_tcpip6 -ErrorAction SilentlyContinue
New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters' -Name 'DisabledComponents' -Value 255 -PropertyType DWord -Force | Out-Null
"#,
                revert: r#"
Enable-NetAdapterBinding -Name "*" -ComponentID ms_tcpip6 -ErrorAction SilentlyContinue
Remove-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters' -Name 'DisabledComponents' -ErrorAction SilentlyContinue
"#,
                check: "((Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip6\\Parameters' -Name 'DisabledComponents' -ErrorAction SilentlyContinue).'DisabledComponents' -eq 255)",
            },
        },
        // ----------------------- INTERFAZ (nuevos) -----------------------
        Tweak {
            id: "sticky-keys",
            category: "Interfaz",
            title: "Desactivar acceso directo de teclas especiales",
            description: "Deshabilita el cuadro de diálogo que aparece al pulsar Mayúsculas 5 veces (Sticky Keys). No desactiva la funcionalidad, solo la interrupción.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKCU:\Control Panel\Accessibility\StickyKeys", "Flags", RegKind::Sz, "506", Some("510")),
                reg(r"HKCU:\Control Panel\Accessibility\Keyboard Response", "Flags", RegKind::Sz, "122", Some("126")),
                reg(r"HKCU:\Control Panel\Accessibility\ToggleKeys", "Flags", RegKind::Sz, "58", Some("62")),
            ]),
        },
        Tweak {
            id: "num-lock-startup",
            category: "Interfaz",
            title: "Activar Bloq Num al iniciar Windows",
            description: "El teclado numérico estará activo al arrancar sin necesidad de pulsarlo manualmente.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKCU:\Control Panel\Keyboard", "InitialKeyboardIndicators", RegKind::Sz, "2", Some("0")),
                reg(r"HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon", "InitialKeyboardIndicators", RegKind::Sz, "2", Some("0")),
            ]),
        },
        Tweak {
            id: "hidden-files",
            category: "Interfaz",
            title: "Mostrar archivos y carpetas ocultos",
            description: "El Explorador de archivos mostrará los elementos marcados como ocultos por el sistema.",
            recommended: false,
            action: Action::Registry(vec![
                reg(EXPLORER_ADV, "Hidden", RegKind::Dword, "1", Some("2")),
            ]),
        },
        Tweak {
            id: "taskbar-search-hidden",
            category: "Interfaz",
            title: "Ocultar icono de búsqueda de la barra de tareas",
            description: "Elimina el botón de búsqueda visual. El buscador sigue funcionando con la tecla Win.",
            recommended: false,
            action: Action::Registry(vec![
                reg(SEARCH_SETTINGS, "SearchboxTaskbarMode", RegKind::Dword, "0", Some("1")),
            ]),
        },
        Tweak {
            id: "taskbar-taskview-hidden",
            category: "Interfaz",
            title: "Ocultar botón Vista de tareas",
            description: "Elimina el botón de escritorios virtuales de la barra de tareas.",
            recommended: false,
            action: Action::Registry(vec![
                reg(EXPLORER_ADV, "ShowTaskViewButton", RegKind::Dword, "0", Some("1")),
            ]),
        },
        Tweak {
            id: "scrollbars-visible",
            category: "Interfaz",
            title: "Barras de desplazamiento siempre visibles",
            description: "Muestra las barras de scroll permanentemente en lugar de ocultarlas cuando no hay foco.",
            recommended: false,
            action: Action::Registry(vec![
                reg(r"HKCU:\Control Panel\Accessibility", "DynamicScrollbars", RegKind::Dword, "0", Some("1")),
            ]),
        },
        Tweak {
            id: "explorer-home-gallery",
            category: "Interfaz",
            title: "Quitar Inicio y Galería del Explorador (Win11)",
            description: "Elimina las secciones Inicio y Galería del panel izquierdo del Explorador y lo abre directamente en Este equipo.",
            recommended: false,
            action: Action::Script {
                apply: r#"
Remove-Item -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Desktop\NameSpace\{f874310e-b6b7-47dc-bc84-b9e6b38f5903}' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Desktop\NameSpace\{e88865ea-0e1c-4e20-9aa6-edcd0212c87c}' -Recurse -Force -ErrorAction SilentlyContinue
New-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'LaunchTo' -Value 1 -PropertyType DWord -Force | Out-Null
"#,
                revert: r#"
$k1 = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Desktop\NameSpace\{f874310e-b6b7-47dc-bc84-b9e6b38f5903}'
$k2 = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Desktop\NameSpace\{e88865ea-0e1c-4e20-9aa6-edcd0212c87c}'
if (-not (Test-Path $k1)) { New-Item -Path $k1 -Force | Out-Null }
if (-not (Test-Path $k2)) { New-Item -Path $k2 -Force | Out-Null }
Remove-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'LaunchTo' -ErrorAction SilentlyContinue
"#,
                check: "(-not (Test-Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Desktop\\NameSpace\\{f874310e-b6b7-47dc-bc84-b9e6b38f5903}'))",
            },
        },
        Tweak {
            id: "battery-percentage",
            category: "Interfaz",
            title: "Mostrar porcentaje de batería en la barra de tareas",
            description: "Añade el número de porcentaje junto al icono de batería. Útil en portátiles.",
            recommended: false,
            action: Action::Registry(vec![
                reg(r"HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\FlyoutMenuSettings", "ShowBatteryPercent", RegKind::Dword, "1", Some("0")),
            ]),
        },
        // ----------------------- SISTEMA (nuevos) -----------------------
        Tweak {
            id: "storage-sense",
            category: "Sistema",
            title: "Desactivar Sensor de almacenamiento",
            description: "Impide que Windows borre archivos automáticamente con Storage Sense. Tú controlas cuándo limpiar.",
            recommended: true,
            action: Action::Registry(vec![
                reg(r"HKLM:\SOFTWARE\Policies\Microsoft\Windows\StorageSense", "AllowStorageSenseGlobal", RegKind::Dword, "0", None),
            ]),
        },
        Tweak {
            id: "long-paths",
            category: "Sistema",
            title: "Habilitar rutas largas (más de 260 caracteres)",
            description: "Permite rutas de más de 260 caracteres. Necesario para algunos proyectos de desarrollo.",
            recommended: false,
            action: Action::Registry(vec![
                reg(r"HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem", "LongPathsEnabled", RegKind::Dword, "1", Some("0")),
            ]),
        },
        Tweak {
            id: "utc-clock",
            category: "Sistema",
            title: "Reloj del hardware en UTC (dual boot Linux)",
            description: "Windows usará UTC como hora del hardware. Necesario para no tener desfase horario en dual boot con Linux.",
            recommended: false,
            action: Action::Script {
                apply: r#"New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\TimeZoneInformation' -Name 'RealTimeIsUniversal' -Value 1 -PropertyType QWord -Force | Out-Null"#,
                revert: r#"Remove-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\TimeZoneInformation' -Name 'RealTimeIsUniversal' -ErrorAction SilentlyContinue"#,
                check: "((Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\TimeZoneInformation' -Name 'RealTimeIsUniversal' -ErrorAction SilentlyContinue).'RealTimeIsUniversal' -eq 1)",
            },
        },
        // ----------------------- AVANZADO (BAJO TU PROPIO RIESGO) -----------------------
        // Estos tweaks NO se recomiendan: pueden reducir la seguridad o requerir
        // reinicio. Son reversibles, pero actívalos solo si sabes lo que haces.
        Tweak {
            id: "ultimate-performance",
            category: "Avanzado",
            title: "Plan de energía: Rendimiento máximo",
            description: "Activa el plan oculto 'Ultimate Performance'. Maximiza el rendimiento a costa de mayor consumo. No recomendado en portátiles.",
            recommended: false,
            action: Action::Script {
                apply: "powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 | Out-Null; powercfg /setactive e9a42b02-d5df-448d-aa00-03f14749eb61",
                revert: "powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e; powercfg -delete e9a42b02-d5df-448d-aa00-03f14749eb61 2>$null",
                check: "((powercfg /getactivescheme) -match 'e9a42b02-d5df-448d-aa00-03f14749eb61')",
            },
        },
        Tweak {
            id: "disable-power-throttling",
            category: "Avanzado",
            title: "Desactivar Power Throttling",
            description: "Impide que Windows limite la CPU de procesos en segundo plano. Más rendimiento, más consumo. Requiere reinicio.",
            recommended: false,
            action: Action::Registry(vec![
                reg(r"HKLM:\SYSTEM\CurrentControlSet\Control\Power\PowerThrottling", "PowerThrottlingOff", RegKind::Dword, "1", Some("0")),
            ]),
        },
        Tweak {
            id: "disable-spectre-meltdown",
            category: "Avanzado",
            title: "Desactivar mitigaciones Spectre/Meltdown",
            description: "⚠️ Mejora el rendimiento de la CPU pero REDUCE LA SEGURIDAD frente a vulnerabilidades conocidas. Requiere reinicio. Úsalo bajo tu responsabilidad.",
            recommended: false,
            action: Action::Registry(vec![
                reg(r"HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management", "FeatureSettingsOverride", RegKind::Dword, "3", None),
                reg(r"HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management", "FeatureSettingsOverrideMask", RegKind::Dword, "3", None),
            ]),
        },
        Tweak {
            id: "disable-hvci",
            category: "Avanzado",
            title: "Desactivar Integridad de memoria (HVCI)",
            description: "⚠️ Mejora el rendimiento (especialmente en juegos) pero REDUCE LA SEGURIDAD del kernel. Requiere reinicio. Úsalo bajo tu responsabilidad.",
            recommended: false,
            action: Action::Registry(vec![
                reg(r"HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity", "Enabled", RegKind::Dword, "0", Some("1")),
            ]),
        },
        Tweak {
            id: "disable-uac",
            category: "Avanzado",
            title: "Desactivar Control de cuentas (UAC)",
            description: "⚠️ Quita las ventanas de confirmación de administrador. REDUCE MUCHO LA SEGURIDAD del sistema. Requiere reinicio. Muy desaconsejado.",
            recommended: false,
            action: Action::Registry(vec![
                reg(r"HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System", "EnableLUA", RegKind::Dword, "0", Some("1")),
            ]),
        },
        Tweak {
            id: "edge-debloat",
            category: "Avanzado",
            title: "Reducir telemetría y funciones de Edge (directivas)",
            description: "⚠️ Deshabilita via directivas la telemetría, recomendaciones de compras, Rewards y rastreo de Microsoft Edge. Puede interferir con políticas corporativas.",
            recommended: false,
            action: Action::Script {
                apply: r#"
$p = 'HKLM:\SOFTWARE\Policies\Microsoft\Edge'
if (-not (Test-Path $p)) { New-Item -Path $p -Force | Out-Null }
$keys = @{
    'MetricsReportingEnabled'=0; 'SendSiteInfoToImproveServices'=0
    'PersonalizationReportingEnabled'=0; 'ShoppingAssistantEnabled'=0
    'EdgeShoppingAssistantEnabled'=0; 'MicrosoftEdgeInsiderPromotionEnabled'=0
    'ShowRecommendationsEnabled'=0; 'HubsSidebarEnabled'=0
    'CryptoWalletEnabled'=0; 'ResolveNavigationErrorsUseWebService'=0
    'AlternateErrorPagesEnabled'=0; 'EdgeFollowEnabled'=0
    'EdgeCollectionsEnabled'=0
}
foreach ($k in $keys.GetEnumerator()) {
    New-ItemProperty -Path $p -Name $k.Key -Value $k.Value -PropertyType DWord -Force | Out-Null
}
"#,
                revert: r#"
$p = 'HKLM:\SOFTWARE\Policies\Microsoft\Edge'
if (Test-Path $p) { Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue }
"#,
                check: "((Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge' -Name 'MetricsReportingEnabled' -ErrorAction SilentlyContinue).'MetricsReportingEnabled' -eq 0)",
            },
        },
        Tweak {
            id: "onedrive-remove",
            category: "Avanzado",
            title: "⚠️ Eliminar OneDrive del sistema",
            description: "⚠️ Desinstala OneDrive, limpia sus carpetas residuales y deshabilita su servicio de sincronización. Si usas OneDrive, NO actives esto.",
            recommended: false,
            action: Action::Script {
                apply: r#"
Stop-Process -Name 'OneDrive' -Force -ErrorAction SilentlyContinue
$odu = "$env:SystemRoot\SysWOW64\OneDriveSetup.exe"
if (-not (Test-Path $odu)) { $odu = "$env:SystemRoot\System32\OneDriveSetup.exe" }
if (Test-Path $odu) { Start-Process $odu '/uninstall' -Wait -ErrorAction SilentlyContinue }
Remove-Item -Path "$env:USERPROFILE\OneDrive" -Force -Recurse -ErrorAction SilentlyContinue
Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\OneDrive" -Force -Recurse -ErrorAction SilentlyContinue
Remove-Item -Path "$env:ProgramData\Microsoft OneDrive" -Force -Recurse -ErrorAction SilentlyContinue
Remove-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run' -Name 'OneDrive' -ErrorAction SilentlyContinue
Set-Service -Name 'OneSyncSvc' -StartupType Disabled -ErrorAction SilentlyContinue
"#,
                revert: r#"Set-Service -Name 'OneSyncSvc' -StartupType Manual -ErrorAction SilentlyContinue"#,
                check: r#"(-not (Test-Path "$env:LOCALAPPDATA\Microsoft\OneDrive\OneDrive.exe"))"#,
            },
        },
    ]
}

fn find(id: &str) -> Result<Tweak, String> {
    catalog()
        .into_iter()
        .find(|t| t.id == id)
        .ok_or_else(|| format!("Tweak desconocido: {id}"))
}

// ---------------------------------------------------------------------------
// Comandos expuestos a la UI
// ---------------------------------------------------------------------------

/// Devuelve la metadata de todos los tweaks (sin los comandos internos).
#[tauri::command(async)]
pub fn get_tweaks() -> Vec<TweakMeta> {
    catalog()
        .into_iter()
        .map(|t| TweakMeta {
            id: t.id.to_string(),
            category: t.category.to_string(),
            title: t.title.to_string(),
            description: t.description.to_string(),
            recommended: t.recommended,
            risky: t.category == "Avanzado",
        })
        .collect()
}

/// Aplica un tweak por su id.
#[tauri::command(async)]
pub fn apply_tweak(id: String) -> Result<String, String> {
    let tw = find(&id)?;
    ps::ps_capture(&apply_script(&tw)).map(|_| format!("Aplicado: {}", tw.title))
}

/// Revierte un tweak por su id.
#[tauri::command(async)]
pub fn revert_tweak(id: String) -> Result<String, String> {
    let tw = find(&id)?;
    ps::ps_capture(&revert_script(&tw)).map(|_| format!("Revertido: {}", tw.title))
}

/// Comprueba el estado de todos los tweaks en una sola llamada.
/// Devuelve un objeto { id: bool }.
#[tauri::command(async)]
pub fn check_all_tweaks() -> Result<Value, String> {
    let mut lines = String::from("$ErrorActionPreference='SilentlyContinue'\n$r=[ordered]@{}\n");
    for tw in catalog() {
        let expr = check_expr(&tw);
        // Envolvemos en scriptblock para soportar checks multilinea.
        lines.push_str(&format!(
            "$r['{id}'] = [bool](& {{ {expr} }})\n",
            id = tw.id,
            expr = expr
        ));
    }
    lines.push_str("$r | ConvertTo-Json -Compress\n");
    let out = ps::ps_capture(&lines)?;
    serde_json::from_str(&out).map_err(|e| format!("No se pudo comprobar el estado: {e}"))
}
