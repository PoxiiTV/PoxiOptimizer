//! Ejecucion de comandos del sistema (PowerShell / cmd) sin abrir ventanas de
//! consola. Es la unica capa que toca el sistema operativo; todo lo demas pasa
//! por aqui para mantener consistencia y seguridad.

use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

/// Evita que se abra una ventana de consola al lanzar procesos en Windows.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

/// Resultado normalizado de la ejecucion de un comando.
pub struct CmdOutput {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub code: i32,
}

fn finalize(output: std::io::Result<std::process::Output>) -> Result<CmdOutput, String> {
    match output {
        Ok(out) => Ok(CmdOutput {
            success: out.status.success(),
            stdout: String::from_utf8_lossy(&out.stdout).trim().to_string(),
            stderr: String::from_utf8_lossy(&out.stderr).trim().to_string(),
            code: out.status.code().unwrap_or(-1),
        }),
        Err(e) => Err(format!("No se pudo ejecutar el comando: {e}")),
    }
}

/// Ejecuta un script de PowerShell y devuelve su salida.
pub fn run_powershell(script: &str) -> Result<CmdOutput, String> {
    let mut cmd = Command::new("powershell.exe");
    cmd.args([
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        script,
    ]);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    finalize(cmd.output())
}

/// Ejecuta PowerShell y devuelve solo stdout en caso de exito, o un Err con el
/// detalle del fallo. Util para comandos cuyo resultado nos interesa parsear.
pub fn ps_capture(script: &str) -> Result<String, String> {
    let out = run_powershell(script)?;
    if out.success {
        Ok(out.stdout)
    } else {
        let detail = if out.stderr.is_empty() {
            out.stdout
        } else {
            out.stderr
        };
        Err(if detail.is_empty() {
            format!("El comando termino con codigo {}", out.code)
        } else {
            detail
        })
    }
}

/// Lanza un proceso de forma "fire and forget" mostrando ventana (para flujos
/// interactivos como la activacion, donde el usuario debe ver el progreso).
pub fn spawn_visible(program: &str, args: &[&str]) -> Result<(), String> {
    Command::new(program)
        .args(args)
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("No se pudo iniciar el proceso: {e}"))
}
