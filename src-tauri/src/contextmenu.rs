//! Gestión del menú contextual de Windows (submenú PoxiTools ⚡).
//!
//! Cada herramienta se lanza vía un .vbs en ProgramData con wscript //B + SW_HIDE=0
//! → cero parpadeo de ventana. Tras ejecutar la acción se muestra una notificación
//! nativa de Windows (WinRT ToastNotification) atribuida al App ID de PowerShell.

use crate::ps;

const ROOT_KEY: &str = r"HKLM:\SOFTWARE\Classes\Directory\Background\shell\PoxiTools";
const SCRIPTS_DIR: &str = r"C:\ProgramData\PoxiOptimizer\contextmenu";

const INSTALL_SCRIPT: &str = r#"
$ErrorActionPreference = 'SilentlyContinue'
$root    = 'HKLM:\SOFTWARE\Classes\Directory\Background\shell\PoxiTools'
$scripts = 'C:\ProgramData\PoxiOptimizer\contextmenu'
$ico     = '__EXE__,0'
$psAppId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'

New-Item -Path $scripts -ItemType Directory -Force | Out-Null

# Genera el bloque de código PS que muestra una notificación nativa de Windows.
# Devuelve una cadena PS lista para concatenar al final del script de la herramienta.
function Get-ToastCode {
    param([string]$Msg)
    $xmlStr = "<toast><visual><binding template=""ToastGeneric""><text>PoxiTools</text><text>$Msg</text></binding></visual></toast>"
    "; try { `$null=[Windows.UI.Notifications.ToastNotificationManager,Windows.UI.Notifications,ContentType=WindowsRuntime]; `$null=[Windows.Data.Xml.Dom.XmlDocument,Windows.Data.Xml.Dom.XmlDocument,ContentType=WindowsRuntime]; `$xd=New-Object Windows.Data.Xml.Dom.XmlDocument; `$xd.LoadXml('$xmlStr'); [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('$psAppId').Show([Windows.UI.Notifications.ToastNotification]::new(`$xd)) } catch {}"
}

# Escribe un .vbs launcher silencioso y devuelve el valor para el registro command.
function Write-VbsLauncher {
    param([string]$Name, [string]$PsScript, [string]$Toast = '')
    $full = $PsScript
    if ($Toast) { $full += Get-ToastCode $Toast }
    $bytes = [System.Text.Encoding]::Unicode.GetBytes($full)
    $enc   = [Convert]::ToBase64String($bytes)
    $vbs   = "CreateObject(""WScript.Shell"").Run ""powershell.exe -NoProfile -NonInteractive -EncodedCommand $enc"", 0"
    [System.IO.File]::WriteAllText("$scripts\$Name.vbs", $vbs, [System.Text.Encoding]::ASCII)
    "wscript.exe //B //NoLogo `"$scripts\$Name.vbs`""
}

# Registra un item bajo $root\shell con icono y VBS launcher.
function Add-PoxiItem {
    param([string]$Id, [string]$Label, [string]$PsScript, [string]$Toast = '')
    $cmd = Write-VbsLauncher -Name $Id -PsScript $PsScript -Toast $Toast
    $p   = "$root\shell\$Id"
    New-Item -Path $p -Force | Out-Null
    Set-ItemProperty -Path $p -Name '(Default)' -Value $Label -Force
    Set-ItemProperty -Path $p -Name 'Icon'      -Value $ico   -Force
    New-Item -Path "$p\command" -Force | Out-Null
    Set-ItemProperty -Path "$p\command" -Name '(Default)' -Value $cmd -Force
}

# --- Limpiar instalación anterior ---
Remove-Item -Path $root    -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path $scripts -Recurse -Force -ErrorAction SilentlyContinue
New-Item -Path $scripts -ItemType Directory -Force | Out-Null

# --- Clave raíz ---
New-Item -Path $root -Force | Out-Null
Set-ItemProperty -Path $root -Name 'MUIVerb'     -Value 'PoxiTools ⚡' -Force
Set-ItemProperty -Path $root -Name 'SubCommands' -Value ''             -Force
Set-ItemProperty -Path $root -Name 'Icon'        -Value $ico           -Force
Set-ItemProperty -Path $root -Name 'Position'    -Value 'Bottom'       -Force
New-Item -Path "$root\shell" -Force | Out-Null

# === SISTEMA ===
Add-PoxiItem '01_RestartExplorer' 'Reiniciar Explorador' `
    'Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Start-Process explorer' `
    'Explorador reiniciado'

Add-PoxiItem '02_RebuildIcons' 'Reconstruir cache de iconos' `
    'Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Remove-Item -Path "$env:LOCALAPPDATA\IconCache.db" -Force -ErrorAction SilentlyContinue; Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache_*" -Force -ErrorAction SilentlyContinue; Start-Process explorer' `
    'Cache de iconos reconstruida'

Add-PoxiItem '03_ClearThumbs' 'Limpiar cache de miniaturas' `
    'Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache_*" -Force -ErrorAction SilentlyContinue; Start-Process explorer' `
    'Cache de miniaturas eliminada'

# === LIMPIEZA ===
Add-PoxiItem '04_FreeMemory' 'Liberar memoria' `
    '[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers(); foreach ($proc in (Get-Process | Where-Object {-not $_.HasExited})) { try { $proc.MinWorkingSet = $proc.MinWorkingSet } catch {} }' `
    'Memoria liberada'

Add-PoxiItem '05_DeleteTemp' 'Eliminar temporales' `
    'Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue' `
    'Archivos temporales eliminados'

Add-PoxiItem '06_EmptyRecycleBin' 'Vaciar papelera' `
    'Clear-RecycleBin -Force -ErrorAction SilentlyContinue' `
    'Papelera vaciada'

Add-PoxiItem '07_ToggleHidden' 'Mostrar/ocultar archivos ocultos' `
    '$k = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"; $c = (Get-ItemProperty $k -Name Hidden -ErrorAction SilentlyContinue).Hidden; Set-ItemProperty $k -Name Hidden -Value (if ($c -eq 1) {2} else {1}); Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Process explorer' `
    'Visibilidad de archivos ocultos cambiada'

# === RED ===
Add-PoxiItem '08_FlushDNS' 'Vaciar cache DNS' `
    'ipconfig /flushdns' `
    'Cache DNS vaciada'

Add-PoxiItem '09_CopyIP' 'Copiar IP local' `
    'Add-Type -Assembly System.Windows.Forms; $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -ne "WellKnown" -and $_.IPAddress -notlike "169.*" -and $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1).IPAddress; if ($ip) { [System.Windows.Forms.Clipboard]::SetText($ip) }' `
    'IP local copiada al portapapeles'

Add-PoxiItem '10_ResetNetwork' 'Resetear adaptadores de red' `
    'Start-Process powershell -Verb RunAs -ArgumentList "-WindowStyle Hidden -Command ''netsh winsock reset; netsh int ip reset; ipconfig /release; ipconfig /flushdns; ipconfig /renew''"' `
    'Reseteando red... reinicia el PC al terminar'

# === PANTALLA Y ENERGÍA ===
Add-PoxiItem '11_TurnOffScreen' 'Apagar pantalla' `
    '(Add-Type -MemberDefinition "[DllImport(""user32.dll"")]public static extern IntPtr SendMessage(IntPtr h,uint m,IntPtr w,IntPtr l);" -Name u -Namespace W -PassThru)::SendMessage(-1, 0x0112, [IntPtr]0xF170, [IntPtr]2)' `
    'Pantalla apagada'

Add-PoxiItem '12_NightLight' 'Modo noche' `
    'Start-Process "ms-settings:display"' `
    'Abriendo configuracion de pantalla'

# === PLAN DE ENERGÍA (submenú) ===
$planPath = "$root\shell\13_PowerPlan"
New-Item -Path $planPath -Force | Out-Null
Set-ItemProperty -Path $planPath -Name 'MUIVerb'     -Value 'Plan de energia' -Force
Set-ItemProperty -Path $planPath -Name 'SubCommands' -Value ''                -Force
Set-ItemProperty -Path $planPath -Name 'Icon'        -Value $ico              -Force
New-Item -Path "$planPath\shell" -Force | Out-Null

$cmdHigh = Write-VbsLauncher -Name 'plan_high' -PsScript 'powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c' -Toast 'Plan Alto rendimiento activado'
New-Item -Path "$planPath\shell\01_High" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\01_High" -Name '(Default)' -Value 'Alto rendimiento' -Force
Set-ItemProperty -Path "$planPath\shell\01_High" -Name 'Icon'      -Value $ico              -Force
New-Item -Path "$planPath\shell\01_High\command" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\01_High\command" -Name '(Default)' -Value $cmdHigh -Force

$cmdBal = Write-VbsLauncher -Name 'plan_balanced' -PsScript 'powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e' -Toast 'Plan Equilibrado activado'
New-Item -Path "$planPath\shell\02_Balanced" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\02_Balanced" -Name '(Default)' -Value 'Equilibrado' -Force
Set-ItemProperty -Path "$planPath\shell\02_Balanced" -Name 'Icon'      -Value $ico          -Force
New-Item -Path "$planPath\shell\02_Balanced\command" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\02_Balanced\command" -Name '(Default)' -Value $cmdBal -Force

$cmdSav = Write-VbsLauncher -Name 'plan_saver' -PsScript 'powercfg /setactive a1841308-3541-4fab-bc81-f71556f20b4a' -Toast 'Plan Ahorro de energia activado'
New-Item -Path "$planPath\shell\03_Saver" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\03_Saver" -Name '(Default)' -Value 'Ahorro de energia' -Force
Set-ItemProperty -Path "$planPath\shell\03_Saver" -Name 'Icon'      -Value $ico               -Force
New-Item -Path "$planPath\shell\03_Saver\command" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\03_Saver\command" -Name '(Default)' -Value $cmdSav -Force

# === HERRAMIENTAS ===
Add-PoxiItem '14_TaskMgr' 'Administrador de tareas' 'Start-Process taskmgr' 'Abriendo Administrador de tareas'
Add-PoxiItem '15_RegEdit' 'Editor de Registro'      'Start-Process regedit' 'Abriendo Editor de Registro'

Add-PoxiItem '16_PsAdmin' 'PowerShell como admin' `
    'Start-Process powershell -Verb RunAs -ArgumentList "-NoExit -Command Set-Location $env:USERPROFILE"' `
    'Abriendo PowerShell como administrador'

Add-PoxiItem '17_CmdAdmin' 'CMD como admin' `
    'Start-Process cmd -Verb RunAs' `
    'Abriendo CMD como administrador'

# === ABRIR POXIOPTIMIZER (GUI, no necesita VBS) ===
$pp = "$root\shell\18_PoxiOptimizer"
New-Item -Path $pp -Force | Out-Null
Set-ItemProperty -Path $pp -Name '(Default)' -Value 'Abrir PoxiOptimizer' -Force
Set-ItemProperty -Path $pp -Name 'Icon'      -Value $ico                  -Force
New-Item -Path "$pp\command" -Force | Out-Null
Set-ItemProperty -Path "$pp\command" -Name '(Default)' -Value '"__EXE__"' -Force
"#;

#[tauri::command(async)]
pub fn context_menu_installed() -> bool {
    let script = format!(
        "if (Test-Path '{}') {{ 'yes' }} else {{ 'no' }}",
        ROOT_KEY
    );
    matches!(ps::run_powershell(&script), Ok(out) if out.stdout.trim() == "yes")
}

#[tauri::command(async)]
pub fn install_context_menu() -> Result<String, String> {
    let exe = std::env::current_exe()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();
    let script = INSTALL_SCRIPT.replace("__EXE__", &exe.replace('\'', "''"));
    ps::run_powershell(&script)?;
    Ok("Menú contextual PoxiTools instalado correctamente".to_string())
}

#[tauri::command(async)]
pub fn uninstall_context_menu() -> Result<String, String> {
    let script = format!(
        "Remove-Item -Path '{}' -Recurse -Force -ErrorAction SilentlyContinue; \
         Remove-Item -Path '{}' -Recurse -Force -ErrorAction SilentlyContinue",
        ROOT_KEY, SCRIPTS_DIR
    );
    ps::run_powershell(&script)?;
    Ok("Menú contextual eliminado".to_string())
}
