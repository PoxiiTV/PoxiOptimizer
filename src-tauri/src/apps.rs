//! Instalacion de aplicaciones mediante winget (gestor de paquetes de Windows).

use crate::ps;
use serde::Serialize;

#[derive(Serialize)]
pub struct WingetResult {
    id: String,
    name: String,
    version: String,
}

/// Busca paquetes en winget en vivo y devuelve los resultados.
#[tauri::command(async)]
pub fn winget_search(query: String) -> Result<Vec<WingetResult>, String> {
    let q = query.trim();
    if q.len() < 2 {
        return Ok(vec![]);
    }
    // Validamos la consulta para evitar inyección de argumentos.
    if !q.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, ' ' | '.' | '-' | '_' | '+')) {
        return Err("Búsqueda no válida".to_string());
    }
    let out = ps::run_powershell(&format!(
        "winget search \"{q}\" --accept-source-agreements --disable-interactivity | Out-String"
    ))?;
    Ok(parse_winget_table(&out.stdout))
}

/// Parsea la tabla de texto que devuelve `winget search` usando las posiciones
/// de las columnas de la cabecera (Name / Id / Version).
fn parse_winget_table(text: &str) -> Vec<WingetResult> {
    let lines: Vec<&str> = text.lines().collect();
    // Localizamos la fila de cabecera (contiene "Name" e "Id") y la separadora.
    let header_idx = lines.iter().position(|l| {
        let t = l.trim_start();
        (t.starts_with("Name") || t.starts_with("Nombre")) && l.contains("Id")
    });
    let Some(hi) = header_idx else { return vec![] };
    let header = lines[hi];
    let id_col = header.find("Id").unwrap_or(0);
    let ver_col = header.find("Version").or_else(|| header.find("Versión")).unwrap_or(header.len());

    let mut results = Vec::new();
    for line in lines.iter().skip(hi + 2) {
        // Saltamos líneas vacías, separadores o spinners de progreso.
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('-') || trimmed.chars().all(|c| "-\\|/ ".contains(c)) {
            continue;
        }
        if line.len() < id_col + 1 {
            continue;
        }
        let take = |a: usize, b: usize| -> String {
            let chars: Vec<char> = line.chars().collect();
            let end = b.min(chars.len());
            if a >= end { return String::new(); }
            chars[a..end].iter().collect::<String>().trim().to_string()
        };
        let name = take(0, id_col);
        let id = take(id_col, ver_col);
        let version = {
            let chars: Vec<char> = line.chars().collect();
            if ver_col < chars.len() {
                chars[ver_col..].iter().collect::<String>()
            } else {
                String::new()
            }
        };
        let version = version.split_whitespace().next().unwrap_or("").to_string();
        if id.is_empty() || name.is_empty() || id.contains(' ') {
            continue;
        }
        results.push(WingetResult { id, name, version });
        if results.len() >= 40 {
            break;
        }
    }
    results
}

/// Comprueba si winget esta disponible en el sistema.
#[tauri::command(async)]
pub fn winget_available() -> bool {
    is_winget_available()
}

fn is_winget_available() -> bool {
    matches!(
        ps::run_powershell("if (Get-Command winget -ErrorAction SilentlyContinue) { 'yes' } else { 'no' }"),
        Ok(o) if o.stdout.trim() == "yes"
    )
}

/// Instala winget (App Installer) descargando las dependencias y el bundle
/// directamente desde Microsoft/GitHub sin necesitar la Microsoft Store.
/// Funciona en todas las ediciones de Windows 11 y 10 incluyendo LTSC/IoT.
#[tauri::command(async)]
pub fn ensure_winget() -> Result<String, String> {
    if is_winget_available() {
        return Ok("winget ya está disponible".to_string());
    }
    // Instalamos en orden: VCLibs → UIXaml → winget bundle.
    // Add-AppxPackage <archivo> no requiere la Microsoft Store; instala
    // directamente desde el fichero descargado, como un instalador .exe normal.
    let script = r#"
        $progressPreference = 'SilentlyContinue'
        $ErrorActionPreference = 'SilentlyContinue'
        $tmp = $env:TEMP

        # 1. VCLibs (URL directa de Microsoft, siempre disponible)
        $vcPath = Join-Path $tmp 'poxi_vclibs.appx'
        Invoke-WebRequest 'https://aka.ms/Microsoft.VCLibs.x64.14.00.Desktop' -OutFile $vcPath -TimeoutSec 30
        if (Test-Path $vcPath) { Add-AppxPackage $vcPath -ErrorAction SilentlyContinue }

        # 2. UIXaml + bundle desde la release mas reciente de winget en GitHub
        try {
            $rel = Invoke-RestMethod 'https://api.github.com/repos/microsoft/winget-cli/releases/latest' -TimeoutSec 20

            $xamlAsset = $rel.assets | Where-Object { $_.name -match 'Microsoft\.UI\.Xaml.*x64.*\.appx$' } | Select-Object -First 1
            if ($xamlAsset) {
                $xamlPath = Join-Path $tmp 'poxi_uixaml.appx'
                Invoke-WebRequest $xamlAsset.browser_download_url -OutFile $xamlPath -TimeoutSec 60
                if (Test-Path $xamlPath) { Add-AppxPackage $xamlPath -ErrorAction SilentlyContinue }
            }

            $bundleAsset = $rel.assets | Where-Object { $_.name -like '*.msixbundle' } | Select-Object -First 1
            if ($bundleAsset) {
                $bundlePath = Join-Path $tmp 'poxi_winget.msixbundle'
                Invoke-WebRequest $bundleAsset.browser_download_url -OutFile $bundlePath -TimeoutSec 120
                if (Test-Path $bundlePath) { Add-AppxPackage $bundlePath -ErrorAction SilentlyContinue }
            }
        } catch {}

        Start-Sleep -Seconds 3
    "#;
    ps::run_powershell(script).ok();
    if is_winget_available() {
        Ok("winget instalado correctamente. ✅".to_string())
    } else {
        Err("No se pudo instalar winget automáticamente. Es posible que necesites reiniciar el PC para que los cambios surtan efecto, o instalar manualmente 'App Installer' desde la Microsoft Store.".to_string())
    }
}

/// Instala una aplicacion por su id de winget de forma silenciosa.
#[tauri::command(async)]
pub fn install_app(winget_id: String) -> Result<String, String> {
    // Validamos el id: winget ids son alfanumericos con puntos, guiones y '+'.
    if winget_id.is_empty()
        || !winget_id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '-' | '_' | '+'))
    {
        return Err("Identificador de aplicacion no valido".to_string());
    }
    let script = format!(
        "winget install --id {id} -e --silent --accept-package-agreements --accept-source-agreements --disable-interactivity",
        id = winget_id
    );
    let out = ps::run_powershell(&script)?;
    // winget devuelve 0 en exito; tambien tratamos "ya instalado" como ok.
    if out.success
        || out.stdout.contains("ya est")
        || out.stdout.to_lowercase().contains("already installed")
    {
        Ok(format!("Instalado: {winget_id}"))
    } else {
        let detail = if out.stderr.is_empty() {
            out.stdout
        } else {
            out.stderr
        };
        Err(format!("No se pudo instalar {winget_id}: {detail}"))
    }
}

/// Descarga el instalador de Ninite desde la URL proporcionada y lo ejecuta.
/// Solo se permiten URLs del dominio oficial ninite.com.
///
/// La descarga se hace via PowerShell, pero la ejecucion se lanza directamente
/// desde Rust para que Ninite herede el escritorio interactivo del proceso admin
/// y pueda escribir en Program Files sin "Access is denied".
#[tauri::command(async)]
pub fn install_apps_ninite(url: String) -> Result<String, String> {
    if !url.starts_with("https://ninite.com/") || !url.ends_with("/ninite.exe") {
        return Err("URL de Ninite no válida".to_string());
    }

    // 1. Descargar ninite.exe via PowerShell
    let tmp = std::env::temp_dir().join("poxi_ninite.exe");
    let tmp_ps = tmp.to_string_lossy().replace('\'', "''");
    let safe_url = url.replace('\'', "''");
    let download = format!(
        "$progressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '{url}' -OutFile '{out}' -TimeoutSec 300 -UseBasicParsing",
        url = safe_url,
        out = tmp_ps
    );
    ps::run_powershell(&download)?;

    if !tmp.exists() {
        return Err("No se pudo descargar Ninite".to_string());
    }

    // 2. Ejecutar directamente (no a traves de PowerShell oculto) para que
    //    Ninite tenga acceso al escritorio interactivo y permisos de escritura.
    let _ = std::process::Command::new(&tmp)
        .status()
        .map_err(|e| format!("No se pudo ejecutar Ninite: {e}"))?;

    let _ = std::fs::remove_file(&tmp);
    Ok("Apps instaladas correctamente".to_string())
}

/// [POST-FORMATEO] Intenta poner Chrome como navegador predeterminado.
/// Windows 10/11 protege esta opción (hash UserChoice), así que lanzamos Chrome
/// con --make-default-browser, que abre la confirmación nativa de Windows.
#[tauri::command(async)]
pub fn set_chrome_default() -> Result<String, String> {
    let script = r#"
$paths = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$chrome = $paths | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($chrome) {
  Start-Process $chrome -ArgumentList '--make-default-browser'
  'OK'
} else { 'NOT_FOUND' }
"#;
    let out = ps::ps_capture(script)?;
    if out.trim() == "OK" {
        Ok("Se ha abierto Chrome para confirmarlo como predeterminado".to_string())
    } else {
        Err("Chrome aún no está instalado".to_string())
    }
}
