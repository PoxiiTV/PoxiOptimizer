//! Comprobación de actualizaciones a través de las releases de GitHub.
//! No instala automáticamente (eso requeriría firmar las releases); avisa al
//! usuario y le ofrece abrir la página de descargas.

use crate::ps;
use serde_json::{json, Value};

const REPO: &str = "PoxiiTV/PoxiOptimizer";

/// Comprueba si hay una versión más reciente publicada en GitHub.
/// Devuelve { update_available, current, latest, url, notes }.
#[tauri::command(async)]
pub fn check_update() -> Result<Value, String> {
    let current = env!("CARGO_PKG_VERSION");
    let script = format!(
        r#"
$ErrorActionPreference='Stop'
try {{
  $r = Invoke-RestMethod -Uri 'https://api.github.com/repos/{repo}/releases/latest' -Headers @{{ 'User-Agent' = 'PoxiOptimizer' }} -TimeoutSec 12
  [ordered]@{{ tag = $r.tag_name; url = $r.html_url; notes = $r.body }} | ConvertTo-Json -Compress
}} catch {{
  '{{"tag":"","url":"","notes":""}}'
}}
"#,
        repo = REPO
    );
    let out = ps::ps_capture(&script)?;
    let data: Value = serde_json::from_str(&out).unwrap_or_else(|_| json!({"tag":""}));

    let latest_raw = data.get("tag").and_then(|v| v.as_str()).unwrap_or("");
    let latest = latest_raw.trim_start_matches('v');
    let available = !latest.is_empty() && is_newer(latest, current);

    Ok(json!({
        "update_available": available,
        "current": current,
        "latest": latest,
        "url": data.get("url").and_then(|v| v.as_str()).unwrap_or(""),
        "notes": data.get("notes").and_then(|v| v.as_str()).unwrap_or(""),
    }))
}

/// Compara dos versiones semánticas "a.b.c". Devuelve true si `latest` > `current`.
fn is_newer(latest: &str, current: &str) -> bool {
    let parse = |s: &str| -> Vec<u32> {
        s.split('.').map(|p| p.parse().unwrap_or(0)).collect()
    };
    let (l, c) = (parse(latest), parse(current));
    for i in 0..l.len().max(c.len()) {
        let lv = l.get(i).copied().unwrap_or(0);
        let cv = c.get(i).copied().unwrap_or(0);
        if lv != cv {
            return lv > cv;
        }
    }
    false
}
