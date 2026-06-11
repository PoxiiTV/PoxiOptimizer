//! Exportar e importar la configuración (estado de tweaks) a un archivo JSON,
//! usando los diálogos nativos de Windows mediante PowerShell.

use crate::ps;

/// Abre un diálogo "Guardar como" y escribe el JSON de configuración.
/// Devuelve la ruta elegida, o un error si el usuario cancela.
#[tauri::command(async)]
pub fn export_config(json: String) -> Result<String, String> {
    // Codificamos el JSON en Base64 para pasarlo sin problemas de escape.
    use std::fmt::Write;
    let b64 = base64_encode(json.as_bytes());
    let mut script = String::new();
    let _ = write!(
        script,
        r#"
Add-Type -AssemblyName System.Windows.Forms
$dlg = New-Object System.Windows.Forms.SaveFileDialog
$dlg.Filter = 'PoxiOptimizer config (*.json)|*.json'
$dlg.FileName = 'poxi-optimizer-config.json'
$dlg.Title = 'Exportar configuracion de PoxiOptimizer'
if ($dlg.ShowDialog() -eq 'OK') {{
  $bytes = [Convert]::FromBase64String('{b64}')
  [System.IO.File]::WriteAllBytes($dlg.FileName, $bytes)
  $dlg.FileName
}} else {{ 'CANCELLED' }}
"#,
        b64 = b64
    );
    let out = ps::ps_capture(&script)?;
    if out.trim() == "CANCELLED" || out.trim().is_empty() {
        Err("Exportación cancelada".to_string())
    } else {
        Ok(format!("Configuración guardada en: {}", out.trim()))
    }
}

/// Abre un diálogo "Abrir" y devuelve el contenido JSON del archivo elegido.
#[tauri::command(async)]
pub fn import_config() -> Result<String, String> {
    let script = r#"
Add-Type -AssemblyName System.Windows.Forms
$dlg = New-Object System.Windows.Forms.OpenFileDialog
$dlg.Filter = 'PoxiOptimizer config (*.json)|*.json'
$dlg.Title = 'Importar configuracion de PoxiOptimizer'
if ($dlg.ShowDialog() -eq 'OK') {
  Get-Content -Path $dlg.FileName -Raw
} else { 'CANCELLED' }
"#;
    let out = ps::ps_capture(script)?;
    if out.trim() == "CANCELLED" || out.trim().is_empty() {
        Err("Importación cancelada".to_string())
    } else {
        Ok(out)
    }
}

/// Codificación Base64 mínima (sin dependencias externas).
fn base64_encode(input: &[u8]) -> String {
    const T: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::new();
    for chunk in input.chunks(3) {
        let b = [
            chunk[0],
            *chunk.get(1).unwrap_or(&0),
            *chunk.get(2).unwrap_or(&0),
        ];
        let n = ((b[0] as u32) << 16) | ((b[1] as u32) << 8) | (b[2] as u32);
        out.push(T[((n >> 18) & 63) as usize] as char);
        out.push(T[((n >> 12) & 63) as usize] as char);
        out.push(if chunk.len() > 1 { T[((n >> 6) & 63) as usize] as char } else { '=' });
        out.push(if chunk.len() > 2 { T[(n & 63) as usize] as char } else { '=' });
    }
    out
}
