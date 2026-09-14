# Upgrade only an explicitly identified owned worker installation. No reboot.
# Run elevated after confirming the cloud queue is idle. Never stops model servers.
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [Parameter(Mandatory=$true)][string]$PreviousRuntimeRoot,
  [Parameter(Mandatory=$true)][string]$PreviousConfig,
  [Parameter(Mandatory=$true)][string]$RuntimeRoot,
  [Parameter(Mandatory=$true)][string]$Config,
  [string]$NodePath='C:\Program Files\nodejs\node.exe',
  [ValidatePattern('^SwingingDoor-CartoonWorker(?:-[A-Za-z0-9-]{1,40})?$')][string]$TaskName='SwingingDoor-CartoonWorker'
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
foreach($value in @($PreviousRuntimeRoot,$PreviousConfig,$RuntimeRoot,$Config,$NodePath)) {
  if($value -notmatch '^[A-Za-z]:[\\/]' -or $value -match '["\r\n]' -or -not(Test-Path -LiteralPath $value)){throw 'All installation paths must be explicit existing local paths.'}
}
$PreviousRuntimeRoot=[IO.Path]::GetFullPath($PreviousRuntimeRoot).TrimEnd('\')
$PreviousConfig=[IO.Path]::GetFullPath($PreviousConfig)
$RuntimeRoot=[IO.Path]::GetFullPath($RuntimeRoot).TrimEnd('\')
$Config=[IO.Path]::GetFullPath($Config)
if($RuntimeRoot -eq $PreviousRuntimeRoot){throw 'Use a new versioned runtime.'}
$task=Get-ScheduledTask -TaskName $TaskName -TaskPath '\'
$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$owner=([Security.Principal.NTAccount]::new($task.Principal.UserId)).Translate([Security.Principal.SecurityIdentifier]).Value
function TaskArgs([string]$Root,[string]$Cfg) {return '-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "'+$Root+'\scripts\automation\start-worker.ps1" -RuntimeRoot "'+$Root+'" -Config "'+$Cfg+'" -NodePath "'+$NodePath+'"'}
function Marker([string]$Root,[string]$Cfg) {
  $bytes=[Text.Encoding]::UTF8.GetBytes((@($sid,$Root.ToLowerInvariant(),$Cfg.ToLowerInvariant(),$NodePath.ToLowerInvariant()) -join '|'))
  $sha=[Security.Cryptography.SHA256]::Create()
  try{$digest=([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-','').ToLowerInvariant()}finally{$sha.Dispose()}
  return 'SwingingDoor worker installation v1; identity='+$digest
}
$oldMarker=Marker $PreviousRuntimeRoot $PreviousConfig
if($owner -ne $sid -or @($task.Actions).Count -ne 1 -or $task.Actions[0].Arguments -ne (TaskArgs $PreviousRuntimeRoot $PreviousConfig) -or -not $task.Description.StartsWith($oldMarker+';')){throw 'The existing task identity differs; left unchanged.'}
$cfg=Get-Content -LiteralPath $Config -Raw | ConvertFrom-Json
$statusPath=Join-Path $cfg.stateRoot 'latest-worker-status.json'
$status=Get-Content -LiteralPath $statusPath -Raw | ConvertFrom-Json
if($status.event -ne 'idle' -or ([DateTime]::UtcNow-[DateTime]::Parse($status.at).ToUniversalTime()).TotalSeconds -gt 20){throw 'Worker is not freshly confirmed idle; no task was changed.'}
$receipt=Get-Content -LiteralPath (Join-Path $PreviousRuntimeRoot 'logs\worker\worker-process.json') -Raw | ConvertFrom-Json
$process=Get-Process -Id $receipt.pid -ErrorAction Stop
$cim=Get-CimInstance Win32_Process -Filter "ProcessId=$($receipt.pid)"
if($process.StartTime.ToUniversalTime().ToString('o') -ne $receipt.startedAt -or $cim.ExecutablePath -ne $NodePath -or -not $cim.CommandLine.Contains($PreviousConfig) -or -not $cim.CommandLine.Contains($PreviousRuntimeRoot+'\scripts\automation\worker.mjs')){throw 'Worker process identity differs; left unchanged.'}
if($PSCmdlet.ShouldProcess($TaskName,'Back up and upgrade this idle worker to the new versioned runtime')) {
  $backup=Join-Path $RuntimeRoot 'task-backups'
  New-Item -ItemType Directory -Path $backup -Force | Out-Null
  [IO.File]::WriteAllText((Join-Path $backup ('previous-'+[DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')+'.xml')),(Export-ScheduledTask -TaskName $TaskName),[Text.UTF8Encoding]::new($false))
  Disable-ScheduledTask -TaskName $TaskName | Out-Null
  # This exact owned Node process is idle, and no GPU/model process is targeted.
  Stop-Process -Id $receipt.pid
  $process.WaitForExit(5000) | Out-Null
  Stop-ScheduledTask -TaskName $TaskName
  $task.Actions=@(New-ScheduledTaskAction -Execute $task.Actions[0].Execute -Argument (TaskArgs $RuntimeRoot $Config) -WorkingDirectory $RuntimeRoot)
  $mode=if($task.Principal.LogonType -eq 'S4U'){'BootS4U'}else{'Logon'}
  $task.Description=(Marker $RuntimeRoot $Config)+"; mode=$mode; runtime=$RuntimeRoot; config=$Config"
  $task.Settings.Enabled=$true
  Register-ScheduledTask -TaskName $TaskName -TaskPath '\' -InputObject $task -Force | Out-Null
  Start-ScheduledTask -TaskName $TaskName
  Write-Output 'Versioned worker upgraded and started. Previous task XML retained. No reboot or model-server restart performed.'
}
