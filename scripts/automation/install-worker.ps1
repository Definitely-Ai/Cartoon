#requires -Version 5.1
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)][string]$RuntimeRoot,
    [Parameter(Mandatory = $true)][string]$Config,
    [string]$NodePath = 'C:\Program Files\nodejs\node.exe',
    [ValidatePattern('^SwingingDoor-CartoonWorker(?:-[A-Za-z0-9-]{1,40})?$')][string]$TaskName = 'SwingingDoor-CartoonWorker',
    [ValidateSet('BootS4U', 'Logon')][string]$Mode = 'BootS4U',
    [string]$UserId = [Security.Principal.WindowsIdentity]::GetCurrent().Name,
    [switch]$UpdateExisting,
    [switch]$Enable
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function FullLocalPath([string]$Value) {
    if ($Value -notmatch '^[A-Za-z]:[\\/]' -or $Value -match '["\r\n]') { throw 'Use an absolute local path without quotes or newlines.' }
    return [IO.Path]::GetFullPath($Value).TrimEnd('\')
}
function QuoteArgument([string]$Value) { return '"' + [regex]::Replace([regex]::Replace($Value, '(\\*)"', '$1$1\"'), '(\\+)$', '$1$1') + '"' }
function SidFor([string]$Account) {
    if ($Account -match '^S-1-') { return ([Security.Principal.SecurityIdentifier]::new($Account)).Value }
    return ([Security.Principal.NTAccount]::new($Account)).Translate([Security.Principal.SecurityIdentifier]).Value
}

$RuntimeRoot = FullLocalPath $RuntimeRoot
$Config = FullLocalPath $Config
$NodePath = FullLocalPath $NodePath
if ($RuntimeRoot -eq [IO.Path]::GetPathRoot($RuntimeRoot).TrimEnd('\')) { throw 'RuntimeRoot must be a dedicated installation directory, not a drive root.' }
$launcherPath = Join-Path $RuntimeRoot 'scripts\automation\start-worker.ps1'
$workerPath = Join-Path $RuntimeRoot 'scripts\automation\worker.mjs'
foreach ($required in @($Config, $NodePath, $launcherPath, $workerPath)) {
    if (-not (Test-Path -LiteralPath $required -PathType Leaf)) { throw "Missing installation file: $required" }
}
$null = Get-Content -LiteralPath $Config -Raw | ConvertFrom-Json
$nodeVersion = & $NodePath --version
if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 22) { throw 'The pinned Node executable must be Node 22 or newer.' }

$current = [Security.Principal.WindowsIdentity]::GetCurrent()
$currentSid = $current.User.Value
$targetSid = SidFor $UserId
if ($targetSid -ne $currentSid) { throw 'Install from the intended worker user account, including when approving UAC. No other account is provisioned by this installer.' }
$elevated = ([Security.Principal.WindowsPrincipal]::new($current)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($Mode -eq 'BootS4U' -and -not $elevated -and -not $WhatIfPreference) { throw 'Boot-trigger registration requires an elevated PowerShell window for this user. The worker still runs with Limited privileges; no password is collected.' }

$powerShellPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$arguments = '-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File ' + (QuoteArgument $launcherPath) + ' -RuntimeRoot ' + (QuoteArgument $RuntimeRoot) + ' -Config ' + (QuoteArgument $Config) + ' -NodePath ' + (QuoteArgument $NodePath)
$identityText = @($targetSid, $RuntimeRoot.ToLowerInvariant(), $Config.ToLowerInvariant(), $NodePath.ToLowerInvariant()) -join '|'
$hasher = [Security.Cryptography.SHA256]::Create()
try { $identity = ([BitConverter]::ToString($hasher.ComputeHash([Text.Encoding]::UTF8.GetBytes($identityText)))).Replace('-', '').ToLowerInvariant() }
finally { $hasher.Dispose() }
$marker = "SwingingDoor worker installation v1; identity=$identity"
$description = "$marker; mode=$Mode; runtime=$RuntimeRoot; config=$Config"

Import-Module ScheduledTasks -ErrorAction Stop
$existing = Get-ScheduledTask -TaskName $TaskName -TaskPath '\' -ErrorAction SilentlyContinue
if ($null -ne $existing) {
    $sameOwner = (SidFor $existing.Principal.UserId) -eq $targetSid
    $sameAction = @($existing.Actions).Count -eq 1 -and $existing.Actions[0].Execute -eq $powerShellPath -and $existing.Actions[0].Arguments -eq $arguments
    if (-not $sameOwner -or -not $sameAction -or -not $existing.Description.StartsWith($marker + ';')) { throw 'A task with this name has a different installation identity. It was left unchanged; use its original installer or a different scoped task name.' }
    if (-not $UpdateExisting) { throw 'This exact installation already exists. Review it and use -UpdateExisting to deliberately update its triggers/settings.' }
    if ($existing.State -eq 'Running') { throw 'The existing worker task is running. Pause new work and let it exit before updating the task; no process was stopped.' }
}

$action = New-ScheduledTaskAction -Execute $powerShellPath -Argument $arguments -WorkingDirectory $RuntimeRoot
$triggers = @(New-ScheduledTaskTrigger -AtLogOn -User $UserId)
if ($Mode -eq 'BootS4U') { $triggers += New-ScheduledTaskTrigger -AtStartup }
# An indefinite repetition renews opportunities even after the bounded native
# failure-restart budget is exhausted. IgnoreNew prevents overlapping instances.
$triggers += New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) -RepetitionInterval ([TimeSpan]::FromMinutes(5))
$principal = New-ScheduledTaskPrincipal -UserId $UserId -LogonType $(if ($Mode -eq 'BootS4U') { 'S4U' } else { 'Interactive' }) -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -RestartCount 3 -RestartInterval ([TimeSpan]::FromMinutes(1)) -ExecutionTimeLimit ([TimeSpan]::Zero) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -DisallowHardTerminate -Disable:(-not $Enable)
$task = New-ScheduledTask -Action $action -Trigger $triggers -Principal $principal -Settings $settings -Description $description

if ($PSCmdlet.ShouldProcess("\$TaskName", "Register $Mode worker task for $UserId (enabled=$([bool]$Enable)); no immediate start")) {
    if ($null -ne $existing) {
        $backupDirectory = Join-Path $RuntimeRoot 'task-backups'
        New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
        $backupPath = Join-Path $backupDirectory ($TaskName + '-' + [datetime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + [guid]::NewGuid().ToString('N') + '.xml')
        [IO.File]::WriteAllText($backupPath, (Export-ScheduledTask -TaskName $TaskName -TaskPath '\'), [Text.UTF8Encoding]::new($false))
    }
    $register = @{ TaskName = $TaskName; TaskPath = '\'; InputObject = $task }
    if ($null -ne $existing) { $register.Force = $true }
    Register-ScheduledTask @register | Out-Null
    $stored = Get-ScheduledTask -TaskName $TaskName -TaskPath '\'
    if ((SidFor $stored.Principal.UserId) -ne $targetSid -or $stored.Principal.RunLevel -ne 'Limited' -or $stored.Actions[0].Arguments -ne $arguments -or [bool]$stored.Settings.Enabled -ne [bool]$Enable) { throw 'The registered task does not match the requested definition; inspect it before starting.' }
    Write-Output "Registered \$TaskName for $UserId, $Mode, Limited privileges, enabled=$([bool]$Enable). No immediate run was requested."
    if ($Mode -eq 'BootS4U') { Write-Output 'Before enabling recurrence, verify raw HTTPS, required local files and GPU inference from this noninteractive task context. Boot readiness has not yet been demonstrated.' }
} else {
    Write-Output "Prepared \$TaskName; mode=$Mode; user=$UserId; Limited privileges; enabled=$([bool]$Enable). No task was registered or started."
}
