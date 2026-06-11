//! Backup de las claves de registro que tocan los tweaks de PoxiOptimizer.
//! Exporta a {Documentos}\PoxiOptimizer\backups\tweaks_YYYYMMDD_HHMMSS.reg

use crate::ps;

/// Claves de registro que cubre el backup (todas las areas que tocan los tweaks).
const BACKUP_PATHS: &[&str] = &[
    // Privacidad
    r"HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows\DataCollection",
    r"HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows\System",
    r"HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\AdvertisingInfo",
    r"HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Privacy",
    r"HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager",
    r"HKEY_CURRENT_USER\SOFTWARE\Microsoft\Siuf\Rules",
    r"HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Search",
    r"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location",
    // Rendimiento
    r"HKEY_CURRENT_USER\System\GameConfigStore",
    r"HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows\GameDVR",
    r"HKEY_CURRENT_USER\SOFTWARE\Microsoft\GameBar",
    r"HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications",
    r"HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Serialize",
    r"HKEY_CURRENT_USER\Control Panel\Desktop",
    r"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile",
    // Interfaz
    r"HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize",
    r"HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced",
    r"HKEY_CURRENT_USER\SOFTWARE\Policies\Microsoft\Windows\Explorer",
    r"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System",
    r"HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Dsh",
    // Avanzado
    r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Power\PowerThrottling",
    r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management",
    r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity",
];

/// Crea un .reg con todas las claves relevantes. Devuelve la ruta del fichero.
#[tauri::command(async)]
pub fn create_registry_backup() -> Result<String, String> {
    let paths_str = BACKUP_PATHS
        .iter()
        .map(|p| format!("  '{}'", p))
        .collect::<Vec<_>>()
        .join(",\r\n");

    let script = format!(
        r#"
$ErrorActionPreference = 'SilentlyContinue'
$dir = "$env:USERPROFILE\Documents\PoxiOptimizer\backups"
$null = New-Item -ItemType Directory -Force -Path $dir
$ts  = Get-Date -Format 'yyyyMMdd_HHmmss'
$dest = "$dir\tweaks_$ts.reg"
$tmp  = "$env:TEMP\poxibak_tmp.reg"

$combined = "Windows Registry Editor Version 5.00`r`n"
$paths = @(
{paths}
)
foreach ($p in $paths) {{
    $null = reg export $p $tmp /y 2>$null
    if (Test-Path $tmp) {{
        $raw = Get-Content -Path $tmp -Raw -Encoding Unicode
        $raw = $raw -replace 'Windows Registry Editor Version 5\.00\r\n', ''
        $combined += "`r`n" + $raw
        Remove-Item $tmp -Force -ErrorAction SilentlyContinue
    }}
}}
[System.IO.File]::WriteAllText($dest, $combined, [System.Text.Encoding]::Unicode)
Write-Output $dest
"#,
        paths = paths_str
    );

    let out = ps::ps_capture(&script)?;
    let path = out.trim().to_string();
    if path.is_empty() {
        return Err("No se pudo crear el backup del registro".to_string());
    }
    Ok(path)
}

/// Lista los archivos .reg de backup ordenados del más reciente al más antiguo.
#[tauri::command(async)]
pub fn list_backups() -> Result<Vec<String>, String> {
    let userprofile = std::env::var("USERPROFILE").unwrap_or_default();
    let dir = format!(r"{}\Documents\PoxiOptimizer\backups", userprofile);
    if !std::path::Path::new(&dir).exists() {
        return Ok(vec![]);
    }
    let mut entries: Vec<_> = std::fs::read_dir(&dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().and_then(|s| s.to_str()) == Some("reg"))
        .collect();
    entries.sort_by(|a, b| {
        b.metadata()
            .and_then(|m| m.modified())
            .ok()
            .cmp(&a.metadata().and_then(|m| m.modified()).ok())
    });
    Ok(entries
        .iter()
        .map(|e| e.file_name().to_string_lossy().to_string())
        .collect())
}

/// Abre la carpeta de backups en el Explorador de Windows.
#[tauri::command(async)]
pub fn open_backups_folder() -> Result<(), String> {
    let userprofile = std::env::var("USERPROFILE").unwrap_or_default();
    let dir = format!(r"{}\Documents\PoxiOptimizer\backups", userprofile);
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    std::process::Command::new("explorer.exe")
        .arg(&dir)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}
