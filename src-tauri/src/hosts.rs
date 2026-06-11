//! Gestion del archivo hosts de Windows.
//! Siempre hace un .bak antes de escribir y flushea el DNS despues.

use crate::ps;

const HOSTS_PATH: &str = r"C:\Windows\System32\drivers\etc\hosts";
const HOSTS_BAK: &str = r"C:\Windows\System32\drivers\etc\hosts.bak";

const DEFAULT_HOSTS: &[u8] = b"# Copyright (c) 1993-2009 Microsoft Corp.\r\n\
#\r\n\
# This is a sample HOSTS file used by Microsoft TCP/IP for Windows.\r\n\
#\r\n\
# Each entry should be kept on an individual line. The IP address should\r\n\
# be placed in the first column followed by the corresponding host name.\r\n\
# The IP address and the host name should be separated by at least one\r\n\
# space.\r\n\
#\r\n\
# Additionally, comments (such as these) may be inserted on individual\r\n\
# lines or following the machine name denoted by a '#' symbol.\r\n\
#\r\n\
# localhost name resolution is handled within DNS itself.\r\n\
#\t127.0.0.1       localhost\r\n\
#\t::1             localhost\r\n";

/// Lee el contenido actual del archivo hosts.
#[tauri::command(async)]
pub fn get_hosts() -> Result<String, String> {
    std::fs::read_to_string(HOSTS_PATH)
        .map_err(|e| format!("No se pudo leer el archivo hosts: {e}"))
}

/// Escribe el nuevo contenido del archivo hosts.
/// Valida el tamaño, crea .bak previo y flushea el DNS.
#[tauri::command(async)]
pub fn set_hosts(content: String) -> Result<(), String> {
    if content.len() > 500_000 {
        return Err("El contenido del archivo hosts es demasiado grande (>500 KB)".to_string());
    }
    // Copia de seguridad del archivo actual
    let _ = std::fs::copy(HOSTS_PATH, HOSTS_BAK);
    // Escribe el nuevo contenido
    std::fs::write(HOSTS_PATH, content.as_bytes())
        .map_err(|e| format!("No se pudo escribir el archivo hosts: {e}"))?;
    // Flushea el caché DNS
    let _ = ps::ps_capture("ipconfig /flushdns");
    Ok(())
}

/// Restaura el archivo hosts al contenido por defecto de Windows.
#[tauri::command(async)]
pub fn reset_hosts() -> Result<(), String> {
    let _ = std::fs::copy(HOSTS_PATH, HOSTS_BAK);
    std::fs::write(HOSTS_PATH, DEFAULT_HOSTS)
        .map_err(|e| format!("No se pudo restaurar el archivo hosts: {e}"))?;
    let _ = ps::ps_capture("ipconfig /flushdns");
    Ok(())
}
