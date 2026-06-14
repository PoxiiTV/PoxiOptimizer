//! Gestión del menú contextual de Windows (submenú PoxiTools ⚡).
//!
//! IDs de herramientas (determinan el orden en el menú — orden alfanumérico):
//!
//!   SISTEMA           01-03
//!   LIMPIEZA          04-07
//!   RED               08-11  (11 = Ping Google, nuevo)
//!   PANTALLA/ENERGÍA  12-15  (14 = Bloquear pantalla, nuevo; 15 = plan energía)
//!   HERRAMIENTAS      16-22  (20 = Dev. Manager, 21 = msconfig, nuevos)
//!
//! El frontend pasa un Vec<String> con los IDs activos; el PS script salta los
//! no incluidos gracias a `if ('ID' -in $enabled) { ... }`.

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

function Get-ToastCode {
    param([string]$Msg)
    $xmlStr = "<toast><visual><binding template=""ToastGeneric""><text>PoxiTools</text><text>$Msg</text></binding></visual></toast>"
    "; try { `$null=[Windows.UI.Notifications.ToastNotificationManager,Windows.UI.Notifications,ContentType=WindowsRuntime]; `$null=[Windows.Data.Xml.Dom.XmlDocument,Windows.Data.Xml.Dom.XmlDocument,ContentType=WindowsRuntime]; `$xd=New-Object Windows.Data.Xml.Dom.XmlDocument; `$xd.LoadXml('$xmlStr'); [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('$psAppId').Show([Windows.UI.Notifications.ToastNotification]::new(`$xd)) } catch {}"
}

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

# ── SISTEMA ──────────────────────────────────────────────────────────────────
if ('01_RestartExplorer' -in $enabled) {
    Add-PoxiItem '01_RestartExplorer' 'Reiniciar Explorador' `
        'Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Start-Process explorer' `
        'Explorador reiniciado'
}
if ('02_RebuildIcons' -in $enabled) {
    Add-PoxiItem '02_RebuildIcons' 'Reconstruir cache de iconos' `
        'Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Remove-Item -Path "$env:LOCALAPPDATA\IconCache.db" -Force -ErrorAction SilentlyContinue; Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache_*" -Force -ErrorAction SilentlyContinue; Start-Process explorer' `
        'Cache de iconos reconstruida'
}
if ('03_ClearThumbs' -in $enabled) {
    Add-PoxiItem '03_ClearThumbs' 'Limpiar cache de miniaturas' `
        'Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache_*" -Force -ErrorAction SilentlyContinue; Start-Process explorer' `
        'Cache de miniaturas eliminada'
}

# ── LIMPIEZA ──────────────────────────────────────────────────────────────────
if ('04_FreeMemory' -in $enabled) {
    Add-PoxiItem '04_FreeMemory' 'Liberar memoria' `
        '[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers(); foreach ($proc in (Get-Process | Where-Object {-not $_.HasExited})) { try { $proc.MinWorkingSet = $proc.MinWorkingSet } catch {} }' `
        'Memoria liberada'
}
if ('05_DeleteTemp' -in $enabled) {
    Add-PoxiItem '05_DeleteTemp' 'Eliminar temporales' `
        'Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue' `
        'Archivos temporales eliminados'
}
if ('06_EmptyRecycleBin' -in $enabled) {
    Add-PoxiItem '06_EmptyRecycleBin' 'Vaciar papelera' `
        'Clear-RecycleBin -Force -ErrorAction SilentlyContinue' `
        'Papelera vaciada'
}
if ('07_ToggleHidden' -in $enabled) {
    Add-PoxiItem '07_ToggleHidden' 'Mostrar/ocultar archivos ocultos' `
        '$k = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"; $c = (Get-ItemProperty $k -Name Hidden -ErrorAction SilentlyContinue).Hidden; Set-ItemProperty $k -Name Hidden -Value (if ($c -eq 1) {2} else {1}); Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Process explorer' `
        'Visibilidad de archivos ocultos cambiada'
}

# ── RED ───────────────────────────────────────────────────────────────────────
if ('08_FlushDNS' -in $enabled) {
    Add-PoxiItem '08_FlushDNS' 'Vaciar cache DNS' 'ipconfig /flushdns' 'Cache DNS vaciada'
}
if ('09_CopyIP' -in $enabled) {
    Add-PoxiItem '09_CopyIP' 'Copiar IP local' `
        'Add-Type -Assembly System.Windows.Forms; $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -ne "WellKnown" -and $_.IPAddress -notlike "169.*" -and $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1).IPAddress; if ($ip) { [System.Windows.Forms.Clipboard]::SetText($ip) }' `
        'IP local copiada al portapapeles'
}
if ('10_ResetNetwork' -in $enabled) {
    Add-PoxiItem '10_ResetNetwork' 'Resetear adaptadores de red' `
        'Start-Process powershell -Verb RunAs -ArgumentList "-WindowStyle Hidden -Command ''netsh winsock reset; netsh int ip reset; ipconfig /release; ipconfig /flushdns; ipconfig /renew''"' `
        'Reseteando red... reinicia el PC al terminar'
}
if ('11_PingGoogle' -in $enabled) {
    Add-PoxiItem '11_PingGoogle' 'Ping a Google' `
        'Start-Process cmd -ArgumentList "/k ping 8.8.8.8 -n 4"' `
        'Ping en curso...'
}

# ── PANTALLA Y ENERGÍA ────────────────────────────────────────────────────────
if ('12_TurnOffScreen' -in $enabled) {
    Add-PoxiItem '12_TurnOffScreen' 'Apagar pantalla' `
        '(Add-Type -MemberDefinition "[DllImport(""user32.dll"")]public static extern IntPtr SendMessage(IntPtr h,uint m,IntPtr w,IntPtr l);" -Name u -Namespace W -PassThru)::SendMessage(-1, 0x0112, [IntPtr]0xF170, [IntPtr]2)' `
        'Pantalla apagada'
}
if ('13_NightLight' -in $enabled) {
    Add-PoxiItem '13_NightLight' 'Modo noche' 'Start-Process "ms-settings:display"' 'Abriendo configuracion de pantalla'
}
if ('14_LockScreen' -in $enabled) {
    Add-PoxiItem '14_LockScreen' 'Bloquear pantalla' `
        'rundll32.exe user32.dll,LockWorkStation' `
        'Pantalla bloqueada'
}

# Plan de energía (submenú) ───────────────────────────────────────────────────
if ('15_PowerPlan' -in $enabled) {
    $planPath = "$root\shell\15_PowerPlan"
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
}

# ── HERRAMIENTAS ──────────────────────────────────────────────────────────────
if ('16_TaskMgr' -in $enabled) {
    Add-PoxiItem '16_TaskMgr' 'Administrador de tareas' 'Start-Process taskmgr' 'Abriendo Administrador de tareas'
}
if ('17_RegEdit' -in $enabled) {
    Add-PoxiItem '17_RegEdit' 'Editor de Registro' 'Start-Process regedit' 'Abriendo Editor de Registro'
}
if ('18_PsAdmin' -in $enabled) {
    Add-PoxiItem '18_PsAdmin' 'PowerShell como admin' `
        'Start-Process powershell -Verb RunAs -ArgumentList "-NoExit -Command Set-Location $env:USERPROFILE"' `
        'Abriendo PowerShell como administrador'
}
if ('19_CmdAdmin' -in $enabled) {
    Add-PoxiItem '19_CmdAdmin' 'CMD como admin' 'Start-Process cmd -Verb RunAs' 'Abriendo CMD como administrador'
}
if ('20_DevMgmt' -in $enabled) {
    Add-PoxiItem '20_DevMgmt' 'Administrador de dispositivos' 'Start-Process devmgmt.msc' 'Abriendo Administrador de dispositivos'
}
if ('21_Msconfig' -in $enabled) {
    Add-PoxiItem '21_Msconfig' 'Configuracion del sistema' 'Start-Process msconfig' 'Abriendo Configuracion del sistema'
}

# === ABRIR POXIOPTIMIZER (GUI directa, sin VBS) ==============================
if ('22_PoxiOptimizer' -in $enabled) {
    $pp = "$root\shell\22_PoxiOptimizer"
    New-Item -Path $pp -Force | Out-Null
    Set-ItemProperty -Path $pp -Name '(Default)' -Value 'Abrir PoxiOptimizer' -Force
    Set-ItemProperty -Path $pp -Name 'Icon'      -Value $ico                  -Force
    New-Item -Path "$pp\command" -Force | Out-Null
    Set-ItemProperty -Path "$pp\command" -Name '(Default)' -Value '"__EXE__"' -Force
}
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
pub fn install_context_menu(enabled: Vec<String>) -> Result<String, String> {
    let exe = std::env::current_exe()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    // Prepend $enabled array so the PS script can check membership
    let ids: Vec<String> = enabled
        .iter()
        .map(|id| format!("'{}'", id.replace('\'', "''")))
        .collect();
    let enabled_line = format!("$enabled = @({})\n", ids.join(","));

    let script = enabled_line + &INSTALL_SCRIPT.replace("__EXE__", &exe.replace('\'', "''"));
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
