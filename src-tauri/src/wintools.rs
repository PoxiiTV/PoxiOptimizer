//! Acceso rápido a herramientas de administración del sistema Windows.
//! Solo se permiten herramientas de una lista blanca fija.

use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct WinTool {
    pub id: String,
    pub label: String,
    pub desc: String,
    pub cmd: String,
    pub category: String,
}

fn tools() -> Vec<WinTool> {
    let t = |id: &str, label: &str, desc: &str, cmd: &str, category: &str| WinTool {
        id: id.into(),
        label: label.into(),
        desc: desc.into(),
        cmd: cmd.into(),
        category: category.into(),
    };
    vec![
        // Rendimiento y procesos
        t("taskmgr", "Administrador de tareas", "Procesos, rendimiento y usuarios activos", "taskmgr.exe", "Rendimiento"),
        t("resmon", "Monitor de recursos", "CPU, memoria, disco y red en detalle", "resmon.exe", "Rendimiento"),
        t("perfmon", "Monitor de rendimiento", "Contadores y registros de rendimiento avanzados", "perfmon.msc", "Rendimiento"),
        t("msconfig", "Configuración del sistema", "Servicios, arranque y herramientas del sistema", "msconfig.exe", "Rendimiento"),
        // Hardware
        t("devmgmt", "Administrador de dispositivos", "Drivers, hardware y errores de dispositivo", "devmgmt.msc", "Hardware"),
        t("diskmgmt", "Gestión de discos", "Particiones, volúmenes y formateo", "diskmgmt.msc", "Hardware"),
        t("dxdiag", "Diagnóstico DirectX", "Info de tarjeta gráfica, sonido y DirectX", "dxdiag.exe", "Hardware"),
        t("msinfo32", "Información del sistema", "Resumen completo de hardware y software instalado", "msinfo32.exe", "Hardware"),
        // Sistema
        t("control", "Panel de Control", "Configuración clásica del sistema", "control.exe", "Sistema"),
        t("sysdm", "Propiedades del sistema", "Nombre del equipo, hardware y protección del sistema", "sysdm.cpl", "Sistema"),
        t("sysadvanced", "Variables de entorno", "Variables del sistema y PATH", "SystemPropertiesAdvanced.exe", "Sistema"),
        t("eventvwr", "Visor de eventos", "Registro de errores, advertencias y eventos del sistema", "eventvwr.msc", "Sistema"),
        t("compmgmt", "Administración de equipos", "Herramientas de gestión agrupadas", "compmgmt.msc", "Sistema"),
        t("regedit", "Editor del registro", "Edición directa del registro de Windows", "regedit.exe", "Sistema"),
        // Red
        t("ncpa", "Conexiones de red", "Adaptadores de red y configuración IP", "ncpa.cpl", "Red"),
        t("wf", "Firewall de Windows", "Reglas entrantes y salientes del firewall", "wf.msc", "Red"),
        // Energía
        t("powercfg", "Opciones de energía", "Planes de energía y configuración de suspensión", "powercfg.cpl", "Energía"),
        // Sonido
        t("mmsys", "Sonido", "Dispositivos de audio y volumen de aplicaciones", "mmsys.cpl", "Sonido"),
    ]
}

/// Devuelve la lista de herramientas disponibles.
#[tauri::command(async)]
pub fn get_windows_tools() -> Vec<WinTool> {
    tools()
}

/// Abre una herramienta del sistema por su id (lista blanca).
#[tauri::command(async)]
pub fn open_windows_tool(id: String) -> Result<(), String> {
    let tool = tools()
        .into_iter()
        .find(|t| t.id == id)
        .ok_or_else(|| format!("Herramienta desconocida: {id}"))?;

    std::process::Command::new("cmd")
        .args(["/C", "start", "", &tool.cmd])
        .spawn()
        .map_err(|e| e.to_string())
        .map(|_| ())
}
