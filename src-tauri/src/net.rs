//! Gestión de DNS de los adaptadores de red activos.

use crate::ps;

/// Cambia el DNS de todos los adaptadores activos.
/// provider: "google" | "cloudflare" | "auto" (DHCP).
#[tauri::command(async)]
pub fn set_dns(provider: String) -> Result<String, String> {
    let (servers, label) = match provider.as_str() {
        "google" => ("'8.8.8.8','8.8.4.4'", "Google (8.8.8.8)"),
        "cloudflare" => ("'1.1.1.1','1.0.0.1'", "Cloudflare (1.1.1.1)"),
        "auto" => ("", "automático (DHCP)"),
        other => return Err(format!("Proveedor DNS no válido: {other}")),
    };

    let action = if provider == "auto" {
        "Set-DnsClientServerAddress -InterfaceIndex $_.InterfaceIndex -ResetServerAddresses".to_string()
    } else {
        format!("Set-DnsClientServerAddress -InterfaceIndex $_.InterfaceIndex -ServerAddresses {servers}")
    };

    let script = format!(
        r#"
$ErrorActionPreference='SilentlyContinue'
Get-NetAdapter | Where-Object {{ $_.Status -eq 'Up' }} | ForEach-Object {{
  {action}
}}
ipconfig /flushdns | Out-Null
'OK'
"#,
        action = action
    );
    ps::ps_capture(&script).map(|_| format!("DNS configurado: {label}"))
}
