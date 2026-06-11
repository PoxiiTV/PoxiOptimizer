//! Activación/desactivación de características opcionales de Windows.
//! Usa Enable/Disable-WindowsOptionalFeature y Add/Remove-WindowsCapability.

use crate::ps;
use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct WinFeature {
    pub id: String,
    pub name: String,
    pub desc: String,
    pub restart: bool,
}

fn features() -> Vec<WinFeature> {
    let f = |id: &str, name: &str, desc: &str, restart: bool| WinFeature {
        id: id.into(),
        name: name.into(),
        desc: desc.into(),
        restart,
    };
    vec![
        f("dotnet35",  ".NET Framework 2.0 / 3.5",              "Necesario para apps y juegos más antiguos que no usan .NET 4+.", true),
        f("hyper-v",   "Hyper-V",                               "Virtualización nativa de Windows. Para VMs sin VirtualBox ni VMware.", true),
        f("wsl",       "Subsistema de Windows para Linux (WSL)", "Ejecuta distribuciones Linux directamente en Windows.", true),
        f("sandbox",   "Windows Sandbox",                        "Entorno desechable aislado para probar apps o archivos sospechosos.", true),
        f("nfs",       "Cliente NFS",                            "Monta carpetas de servidores Linux/NAS mediante Network File System.", false),
        f("telnet",    "Cliente Telnet",                         "Conexión telnet a servidores legacy. Poco usado hoy en día.", false),
        f("openssh",   "Servidor OpenSSH",                       "Permite conexiones SSH entrantes al equipo.", false),
    ]
}

#[derive(Serialize)]
pub struct FeatureWithState {
    #[serde(flatten)]
    pub feature: WinFeature,
    pub enabled: bool,
}

fn check_feature_script(id: &str) -> String {
    match id {
        "dotnet35"  => "((Get-WindowsOptionalFeature -Online -FeatureName 'NetFx3' -ErrorAction SilentlyContinue).State -eq 'Enabled')".into(),
        "hyper-v"   => "((Get-WindowsOptionalFeature -Online -FeatureName 'Microsoft-Hyper-V-All' -ErrorAction SilentlyContinue).State -eq 'Enabled')".into(),
        "wsl"       => "((Get-WindowsOptionalFeature -Online -FeatureName 'Microsoft-Windows-Subsystem-Linux' -ErrorAction SilentlyContinue).State -eq 'Enabled')".into(),
        "sandbox"   => "((Get-WindowsOptionalFeature -Online -FeatureName 'Containers-DisposableClientVM' -ErrorAction SilentlyContinue).State -eq 'Enabled')".into(),
        "nfs"       => "((Get-WindowsOptionalFeature -Online -FeatureName 'ServicesForNFS-ClientOnly' -ErrorAction SilentlyContinue).State -eq 'Enabled')".into(),
        "telnet"    => "((Get-WindowsOptionalFeature -Online -FeatureName 'TelnetClient' -ErrorAction SilentlyContinue).State -eq 'Enabled')".into(),
        "openssh"   => "((Get-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0' -ErrorAction SilentlyContinue).State -eq 'Installed')".into(),
        _           => "$false".into(),
    }
}

fn enable_script(id: &str) -> Option<String> {
    match id {
        "dotnet35"  => Some("Enable-WindowsOptionalFeature -Online -FeatureName 'NetFx3' -NoRestart".into()),
        "hyper-v"   => Some("Enable-WindowsOptionalFeature -Online -FeatureName 'Microsoft-Hyper-V-All' -NoRestart".into()),
        "wsl"       => Some("Enable-WindowsOptionalFeature -Online -FeatureName 'Microsoft-Windows-Subsystem-Linux' -NoRestart; Enable-WindowsOptionalFeature -Online -FeatureName 'VirtualMachinePlatform' -NoRestart".into()),
        "sandbox"   => Some("Enable-WindowsOptionalFeature -Online -FeatureName 'Containers-DisposableClientVM' -All -NoRestart".into()),
        "nfs"       => Some("Enable-WindowsOptionalFeature -Online -FeatureName 'ServicesForNFS-ClientOnly' -NoRestart; Enable-WindowsOptionalFeature -Online -FeatureName 'ClientForNFS-Infrastructure' -NoRestart".into()),
        "telnet"    => Some("Enable-WindowsOptionalFeature -Online -FeatureName 'TelnetClient' -NoRestart".into()),
        "openssh"   => Some("Add-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0'".into()),
        _           => None,
    }
}

fn disable_script(id: &str) -> Option<String> {
    match id {
        "dotnet35"  => Some("Disable-WindowsOptionalFeature -Online -FeatureName 'NetFx3' -NoRestart".into()),
        "hyper-v"   => Some("Disable-WindowsOptionalFeature -Online -FeatureName 'Microsoft-Hyper-V-All' -NoRestart".into()),
        "wsl"       => Some("Disable-WindowsOptionalFeature -Online -FeatureName 'Microsoft-Windows-Subsystem-Linux' -NoRestart".into()),
        "sandbox"   => Some("Disable-WindowsOptionalFeature -Online -FeatureName 'Containers-DisposableClientVM' -NoRestart".into()),
        "nfs"       => Some("Disable-WindowsOptionalFeature -Online -FeatureName 'ServicesForNFS-ClientOnly' -NoRestart".into()),
        "telnet"    => Some("Disable-WindowsOptionalFeature -Online -FeatureName 'TelnetClient' -NoRestart".into()),
        "openssh"   => Some("Remove-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0'".into()),
        _           => None,
    }
}

/// Devuelve todas las características con su estado actual.
#[tauri::command(async)]
pub fn get_windows_features() -> Result<Vec<FeatureWithState>, String> {
    let list = features();
    let mut checks = String::from("$ErrorActionPreference='SilentlyContinue'\n$r=[ordered]@{}\n");
    for f in &list {
        checks.push_str(&format!(
            "$r['{}'] = [bool](& {{ {} }})\n",
            f.id,
            check_feature_script(&f.id)
        ));
    }
    checks.push_str("$r | ConvertTo-Json -Compress\n");

    let out = ps::ps_capture(&checks)?;
    let states: std::collections::HashMap<String, bool> =
        serde_json::from_str(&out).map_err(|e| e.to_string())?;

    Ok(list
        .into_iter()
        .map(|f| {
            let enabled = *states.get(&f.id).unwrap_or(&false);
            FeatureWithState { feature: f, enabled }
        })
        .collect())
}

/// Activa una característica de Windows.
#[tauri::command(async)]
pub fn enable_windows_feature(id: String) -> Result<String, String> {
    let script = enable_script(&id).ok_or_else(|| format!("Característica desconocida: {id}"))?;
    ps::ps_capture(&script).map(|_| format!("Característica activada: {id}"))
}

/// Desactiva una característica de Windows.
#[tauri::command(async)]
pub fn disable_windows_feature(id: String) -> Result<String, String> {
    let script = disable_script(&id).ok_or_else(|| format!("Característica desconocida: {id}"))?;
    ps::ps_capture(&script).map(|_| format!("Característica desactivada: {id}"))
}
