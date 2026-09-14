#requires -Version 5.1
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)][string]$RuntimeRoot,
    [Parameter(Mandatory = $true)][string]$Config,
    [ValidatePattern('^SwingingDoor-CartoonWorker(?:-[A-Za-z0-9-]{1,40})?$')][string]$TaskName = 'SwingingDoor-CartoonWorker',
    [switch]$RemoveTask
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
foreach ($value in @($RuntimeRoot, $Config)) {
    if ($value -notmatch '^[A-Za-z]:[\\/]' -or $value -match '["\r\n]') { throw 'Use absolute local installation paths without quotes or newlines.' }
}
$RuntimeRoot = [IO.Path]::GetFullPath($RuntimeRoot).TrimEnd('\')
$Config = [IO.Path]::GetFullPath($Config).TrimEnd('\')
if ($RuntimeRoot -eq [IO.Path]::GetPathRoot($RuntimeRoot).TrimEnd('\')) { throw 'A drive root is not a worker installation.' }
Import-Module ScheduledTasks -ErrorAction Stop
$task = Get-ScheduledTask -TaskName $TaskName -TaskPath '\' -ErrorAction SilentlyContinue
if ($null -eq $task) { Write-Output "\$TaskName is not installed. No files or processes changed."; return }
$currentSid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$taskSid = if ($task.Principal.UserId -match '^S-1-') { $task.Principal.UserId } else { ([Security.Principal.NTAccount]::new($task.Principal.UserId)).Translate([Security.Principal.SecurityIdentifier]).Value }
$expectedTail = '; runtime=' + $RuntimeRoot + '; config=' + $Config
if ($taskSid -ne $currentSid -or -not $task.Description.StartsWith('SwingingDoor worker installation v1; identity=') -or -not $task.Description.EndsWith($expectedTail) -or @($task.Actions).Count -ne 1 -or $task.Actions[0].Arguments -notlike ('*"' + (Join-Path $RuntimeRoot 'scripts\automation\start-worker.ps1') + '"*')) { throw 'The task does not match this user/runtime/configuration. It was left unchanged.' }

if ($PSCmdlet.ShouldProcess("\$TaskName", 'Back up and disable the exact worker task; preserve all running processes and files')) {
    $backupDirectory = Join-Path $RuntimeRoot 'task-backups'
    New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
    $backupPath = Join-Path $backupDirectory ($TaskName + '-' + [datetime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + [guid]::NewGuid().ToString('N') + '.xml')
    [IO.File]::WriteAllText($backupPath, (Export-ScheduledTask -TaskName $TaskName -TaskPath '\'), [Text.UTF8Encoding]::new($false))
    Disable-ScheduledTask -TaskName $TaskName -TaskPath '\' | Out-Null
    $after = Get-ScheduledTask -TaskName $TaskName -TaskPath '\'
    if ($RemoveTask -and $after.State -ne 'Running') {
        Unregister-ScheduledTask -TaskName $TaskName -TaskPath '\' -Confirm:$false
        Write-Output "Removed only \$TaskName. Its definition is recoverable from $backupPath. Runtime files, configuration, logs and model servers remain."
    } else {
        Write-Output "Disabled future task starts. Any running worker and model servers were left alone. Backup: $backupPath"
        if ($RemoveTask) { Write-Output 'The task is still running. Let the worker exit cleanly, then repeat -RemoveTask; do not terminate active generation.' }
    }
}
