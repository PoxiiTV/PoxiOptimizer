//! Gestión del menú contextual de Windows (submenú PoxiTools ⚡).
//!
//! Escribe claves de registro bajo:
//!   HKLM\SOFTWARE\Classes\Directory\Background\shell\PoxiTools
//!
//! Cada herramienta se lanza vía un pequeño .vbs en ProgramData ejecutado
//! con wscript.exe //B (SW_HIDE=0) → cero parpadeo de ventana negra.
//! Los iconos usan el propio ejecutable de PoxiOptimizer (icono ⚡).

use crate::ps;

const ROOT_KEY: &str = r"HKLM:\SOFTWARE\Classes\Directory\Background\shell\PoxiTools";
const SCRIPTS_DIR: &str = r"C:\ProgramData\PoxiOptimizer\contextmenu";

/// Script de instalación. Placeholders:
///   __EXE__  → ruta absoluta del ejecutable de PoxiOptimizer
const INSTALL_SCRIPT: &str = r#"
$ErrorActionPreference = 'SilentlyContinue'
$root    = 'HKLM:\SOFTWARE\Classes\Directory\Background\shell\PoxiTools'
$scripts = 'C:\ProgramData\PoxiOptimizer\contextmenu'
$ico     = '__EXE__,0'

New-Item -Path $scripts -ItemType Directory -Force | Out-Null

# Escribe un .vbs launcher que ejecuta un script PS en silencio total
# (wscript //B + SW_HIDE=0 → sin ninguna ventana visible, ni un flash)
function Write-VbsLauncher {
    param([string]$Name, [string]$PsScript)
    $bytes = [System.Text.Encoding]::Unicode.GetBytes($PsScript)
    $enc   = [Convert]::ToBase64String($bytes)
    $vbs   = "CreateObject(""WScript.Shell"").Run ""powershell.exe -NoProfile -NonInteractive -EncodedCommand $enc"", 0"
    [System.IO.File]::WriteAllText("$scripts\$Name.vbs", $vbs, [System.Text.Encoding]::ASCII)
    "wscript.exe //B //NoLogo `"$scripts\$Name.vbs`""
}

# Registra un item de menú contextual bajo $root\shell
function Add-PoxiItem {
    param([string]$Id, [string]$Label, [string]$PsScript)
    $cmd = Write-VbsLauncher -Name $Id -PsScript $PsScript
    $p   = "$root\shell\$Id"
    New-Item -Path $p -Force | Out-Null
    Set-ItemProperty -Path $p -Name '(Default)' -Value $Label -Force
    Set-ItemProperty -Path $p -Name 'Icon'      -Value $ico   -Force
    New-Item -Path "$p\command" -Force | Out-Null
    Set-ItemProperty -Path "$p\command" -Name '(Default)' -Value $cmd -Force
}

# --- Limpiar instalación anterior ---
Remove-Item -Path $root -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path $scripts -Recurse -Force -ErrorAction SilentlyContinue
New-Item -Path $scripts -ItemType Directory -Force | Out-Null

# --- Clave raíz del menú ---
New-Item -Path $root -Force | Out-Null
Set-ItemProperty -Path $root -Name 'MUIVerb'     -Value 'PoxiTools ⚡' -Force
Set-ItemProperty -Path $root -Name 'SubCommands' -Value ''             -Force
Set-ItemProperty -Path $root -Name 'Icon'        -Value $ico           -Force
Set-ItemProperty -Path $root -Name 'Position'    -Value 'Bottom'       -Force
New-Item -Path "$root\shell" -Force | Out-Null

# === SISTEMA ===
Add-PoxiItem '01_RestartExplorer' 'Reiniciar Explorador' `
    'Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Start-Process explorer'

Add-PoxiItem '02_RebuildIcons' 'Reconstruir cache de iconos' `
    'Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Remove-Item -Path "$env:LOCALAPPDATA\IconCache.db" -Force -ErrorAction SilentlyContinue; Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache_*" -Force -ErrorAction SilentlyContinue; Start-Process explorer'

Add-PoxiItem '03_ClearThumbs' 'Limpiar cache de miniaturas' `
    'Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache_*" -Force -ErrorAction SilentlyContinue; Start-Process explorer'

# === LIMPIEZA ===
Add-PoxiItem '04_FreeMemory' 'Liberar memoria' `
    '[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers(); foreach ($proc in (Get-Process | Where-Object {-not $_.HasExited})) { try { $proc.MinWorkingSet = $proc.MinWorkingSet } catch {} }'

Add-PoxiItem '05_DeleteTemp' 'Eliminar temporales' `
    'Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue'

Add-PoxiItem '06_EmptyRecycleBin' 'Vaciar papelera' `
    'Clear-RecycleBin -Force -ErrorAction SilentlyContinue'

Add-PoxiItem '07_ToggleHidden' 'Mostrar/ocultar archivos ocultos' `
    '$k = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"; $c = (Get-ItemProperty $k -Name Hidden -ErrorAction SilentlyContinue).Hidden; Set-ItemProperty $k -Name Hidden -Value (if ($c -eq 1) {2} else {1}); Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Start-Process explorer'

# === RED ===
Add-PoxiItem '08_FlushDNS' 'Vaciar cache DNS' `
    'ipconfig /flushdns'

Add-PoxiItem '09_CopyIP' 'Copiar IP local' `
    'Add-Type -Assembly System.Windows.Forms; $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -ne "WellKnown" -and $_.IPAddress -notlike "169.*" -and $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1).IPAddress; if ($ip) { [System.Windows.Forms.Clipboard]::SetText($ip) }'

Add-PoxiItem '10_ResetNetwork' 'Resetear adaptadores de red' `
    'Start-Process powershell -Verb RunAs -ArgumentList "-WindowStyle Hidden -Command ''netsh winsock reset; netsh int ip reset; ipconfig /release; ipconfig /flushdns; ipconfig /renew''"'

# === PANTALLA Y ENERGÍA ===
Add-PoxiItem '11_TurnOffScreen' 'Apagar pantalla' `
    '(Add-Type -MemberDefinition "[DllImport(""user32.dll"")]public static extern IntPtr SendMessage(IntPtr h,uint m,IntPtr w,IntPtr l);" -Name u -Namespace W -PassThru)::SendMessage(-1, 0x0112, [IntPtr]0xF170, [IntPtr]2)'

Add-PoxiItem '12_NightLight' 'Modo noche' `
    'Start-Process "ms-settings:display"'

# === PLAN DE ENERGÍA (submenú) ===
$planPath = "$root\shell\13_PowerPlan"
New-Item -Path $planPath -Force | Out-Null
Set-ItemProperty -Path $planPath -Name 'MUIVerb'     -Value 'Plan de energia' -Force
Set-ItemProperty -Path $planPath -Name 'SubCommands' -Value ''                -Force
Set-ItemProperty -Path $planPath -Name 'Icon'        -Value $ico              -Force
New-Item -Path "$planPath\shell" -Force | Out-Null

$planVbsHigh = "CreateObject(""WScript.Shell"").Run ""powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"", 0"
[System.IO.File]::WriteAllText("$scripts\plan_high.vbs", $planVbsHigh, [System.Text.Encoding]::ASCII)
New-Item -Path "$planPath\shell\01_High" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\01_High" -Name '(Default)' -Value 'Alto rendimiento' -Force
Set-ItemProperty -Path "$planPath\shell\01_High" -Name 'Icon'      -Value $ico              -Force
New-Item -Path "$planPath\shell\01_High\command" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\01_High\command" -Name '(Default)' -Value "wscript.exe //B //NoLogo `"$scripts\plan_high.vbs`"" -Force

$planVbsBal = "CreateObject(""WScript.Shell"").Run ""powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e"", 0"
[System.IO.File]::WriteAllText("$scripts\plan_balanced.vbs", $planVbsBal, [System.Text.Encoding]::ASCII)
New-Item -Path "$planPath\shell\02_Balanced" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\02_Balanced" -Name '(Default)' -Value 'Equilibrado' -Force
Set-ItemProperty -Path "$planPath\shell\02_Balanced" -Name 'Icon'      -Value $ico          -Force
New-Item -Path "$planPath\shell\02_Balanced\command" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\02_Balanced\command" -Name '(Default)' -Value "wscript.exe //B //NoLogo `"$scripts\plan_balanced.vbs`"" -Force

$planVbsSav = "CreateObject(""WScript.Shell"").Run ""powercfg /setactive a1841308-3541-4fab-bc81-f71556f20b4a"", 0"
[System.IO.File]::WriteAllText("$scripts\plan_saver.vbs", $planVbsSav, [System.Text.Encoding]::ASCII)
New-Item -Path "$planPath\shell\03_Saver" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\03_Saver" -Name '(Default)' -Value 'Ahorro de energia' -Force
Set-ItemProperty -Path "$planPath\shell\03_Saver" -Name 'Icon'      -Value $ico               -Force
New-Item -Path "$planPath\shell\03_Saver\command" -Force | Out-Null
Set-ItemProperty -Path "$planPath\shell\03_Saver\command" -Name '(Default)' -Value "wscript.exe //B //NoLogo `"$scripts\plan_saver.vbs`"" -Force

# === HERRAMIENTAS ===
Add-PoxiItem '14_TaskMgr' 'Administrador de tareas' 'Start-Process taskmgr'
Add-PoxiItem '15_RegEdit' 'Editor de Registro'      'Start-Process regedit'

Add-PoxiItem '16_PsAdmin' 'PowerShell como admin' `
    'Start-Process powershell -Verb RunAs -ArgumentList "-NoExit -Command Set-Location $env:USERPROFILE"'

Add-PoxiItem '17_CmdAdmin' 'CMD como admin' `
    'Start-Process cmd -Verb RunAs'

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
