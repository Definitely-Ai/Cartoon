#requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$RuntimeRoot,
    [Parameter(Mandatory = $true)][string]$Config,
    [Parameter(Mandatory = $true)][string]$NodePath,
    [switch]$Once
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function FullLocalPath([string]$Value) {
    if ($Value -notmatch '^[A-Za-z]:[\\/]' -or $Value -match '["\r\n]') { throw 'Use an absolute local path without quotes or newlines.' }
    return [IO.Path]::GetFullPath($Value).TrimEnd('\')
}

# Start-Process joins ArgumentList into a command line. Quote each argument using
# Windows CommandLineToArgvW rules, including backslashes before a closing quote.
function QuoteArgument([string]$Value) {
    if ($Value -match '[\r\n\x00]') { throw 'A process argument contains a control character.' }
    return '"' + [regex]::Replace([regex]::Replace($Value, '(\\*)"', '$1$1\"'), '(\\+)$', '$1$1') + '"'
}

function PropertyOr($Object, [string]$Name, $Default) {
    if ($null -ne $Object -and $null -ne $Object.PSObject.Properties[$Name]) { return $Object.$Name }
    return $Default
}

function WriteReceipt([string]$Path, $Value) {
    $temporary = $Path + '.' + [guid]::NewGuid().ToString('N') + '.tmp'
    [IO.File]::WriteAllText($temporary, ($Value | ConvertTo-Json -Depth 12), [Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $temporary -Destination $Path -Force
}

function Healthy([string]$Url) {
    try { return (Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10 -MaximumRedirection 0).StatusCode -eq 200 }
    catch { return $false }
}

function WaitReady([scriptblock]$Check, [string]$Label, [datetime]$Deadline) {
    $delay = 2
    while (-not (& $Check)) {
        if ([datetime]::UtcNow -ge $Deadline) { throw "Startup timed out waiting for $Label. Existing processes were not stopped." }
        Write-Output ('{0:o} waiting: {1}' -f [datetime]::UtcNow, $Label)
        Start-Sleep -Seconds $delay
        $delay = [Math]::Min(30, $delay * 2)
    }
}

$RuntimeRoot = FullLocalPath $RuntimeRoot
$Config = FullLocalPath $Config
$NodePath = FullLocalPath $NodePath
$workerPath = Join-Path $RuntimeRoot 'scripts\automation\worker.mjs'
$launcherLock = $null
$transcribing = $false

try {
    # The fixed data drive may become available after Task Scheduler starts.
    WaitReady { (Test-Path -LiteralPath $RuntimeRoot -PathType Container) -and (Test-Path -LiteralPath $Config -PathType Leaf) } 'the runtime drive and configuration' ([datetime]::UtcNow.AddMinutes(10))
    if (-not (Test-Path -LiteralPath $NodePath -PathType Leaf) -or -not (Test-Path -LiteralPath $workerPath -PathType Leaf)) { throw 'The pinned Node executable or worker entry point is missing.' }
    $logRoot = Join-Path $RuntimeRoot 'logs\worker'
    New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
    try { $launcherLock = [IO.File]::Open((Join-Path $logRoot 'launcher.lock'), 'OpenOrCreate', 'ReadWrite', 'None') }
    catch [IO.IOException] { Write-Output 'Another launcher holds this runtime lock; no process was started.'; exit 0 }

    $runId = [datetime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + [guid]::NewGuid().ToString('N').Substring(0, 8)
    Start-Transcript -LiteralPath (Join-Path $logRoot ($runId + '.launcher.log')) -NoClobber | Out-Null
    $transcribing = $true
    $configObject = Get-Content -LiteralPath $Config -Raw | ConvertFrom-Json
    $launcher = PropertyOr $configObject 'windowsLauncher' $null
    $timeout = [int](PropertyOr $launcher 'startupTimeoutSeconds' 600)
    if ($timeout -lt 30 -or $timeout -gt 3600) { throw 'windowsLauncher.startupTimeoutSeconds must be 30-3600.' }
    $deadline = [datetime]::UtcNow.AddSeconds($timeout)
    $receiptPath = Join-Path $logRoot 'worker-process.json'
    $rawNodeArguments = @($workerPath, '--config', $Config)
    if ($Once) { $rawNodeArguments += '--once' }
    $nodeArguments = $rawNodeArguments | ForEach-Object { QuoteArgument $_ }
    $nodeArgumentText = $nodeArguments -join ' '
    # Reconcile an orphan Node child even if the supervisor died between process
    # creation and writing its PID receipt. The worker also owns its independent
    # singleton and job leases; this check never clears those locks.
    $matchingWorkers = @(Get-CimInstance Win32_Process -ErrorAction Stop | Where-Object {
        $_.ExecutablePath -eq $NodePath -and $null -ne $_.CommandLine -and $_.CommandLine.EndsWith($nodeArgumentText, [StringComparison]::OrdinalIgnoreCase)
    })
    if ($matchingWorkers.Count -gt 1) { throw 'Multiple matching Node workers are already present; no additional worker was started.' }
    if ($matchingWorkers.Count -eq 1) {
        Write-Output "The exact configured Node worker is already running as PID $($matchingWorkers[0].ProcessId); preserving it."
        exit 0
    }
    if (Test-Path -LiteralPath $receiptPath -PathType Leaf) {
        $prior = Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json
        if ($prior.phase -eq 'running') {
            $priorProcess = Get-Process -Id ([int]$prior.pid) -ErrorAction SilentlyContinue
            if ($null -ne $priorProcess -and $priorProcess.StartTime.ToUniversalTime().ToString('o') -eq $prior.startedAt) {
                if ($prior.nodePath -ne $NodePath -or $prior.workerPath -ne $workerPath -or $prior.configPath -ne $Config -or $priorProcess.Path -ne $NodePath) { throw 'A live worker receipt does not match this installation; inspect it.' }
                Write-Output 'The previously launched Node worker is still running; preserving it.'
                exit 0
            }
        }
    }

    $readinessUrl = [string](PropertyOr $launcher 'readinessUrl' '')
    if ($readinessUrl) {
        $readinessUri = [uri]$readinessUrl
        if ($readinessUri.Scheme -ne 'https' -or $readinessUri.UserInfo -or $readinessUri.Query -or $readinessUri.Fragment) { throw 'readinessUrl must be HTTPS and contain no credentials, query, or fragment.' }
        WaitReady { Healthy $readinessUrl } 'the configured HTTPS readiness endpoint' $deadline
    }
    if ([bool](PropertyOr $launcher 'requireGpu' $true)) {
        $gpuTool = Join-Path $env:SystemRoot 'System32\nvidia-smi.exe'
        WaitReady {
            if (-not (Test-Path -LiteralPath $gpuTool -PathType Leaf)) { return $false }
            $gpuNames = & $gpuTool --query-gpu=name --format=csv,noheader 2>$null
            return $LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace(($gpuNames -join ''))
        } 'the NVIDIA driver and GPU' $deadline
    }

    $services = @(PropertyOr $launcher 'modelServices' @())
    $seen = @{}
    foreach ($service in $services) {
        $name = [string]$service.name
        if ($name -notin @('ollama', 'comfyui') -or $seen.ContainsKey($name)) { throw 'modelServices supports one ollama and one comfyui entry only.' }
        $seen[$name] = $true
        $expectedPort = if ($name -eq 'ollama') { 11435 } else { 8188 }
        $expectedHealth = if ($name -eq 'ollama') { 'http://127.0.0.1:11435/api/tags' } else { 'http://127.0.0.1:8188/system_stats' }
        if ([int]$service.port -ne $expectedPort -or [string]$service.healthUrl -ne $expectedHealth) { throw "Unexpected $name loopback health configuration." }
        if (Healthy $expectedHealth) { Write-Output "$name is healthy; existing process unchanged."; continue }
        $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -eq $expectedPort })
        if ($listeners.Count -gt 0) {
            # A process can be starting or temporarily busy. Wait; never launch a
            # second server against its port or terminate an unknown process.
            WaitReady { Healthy $expectedHealth } "$name on its occupied port" $deadline
            continue
        }
        $program = FullLocalPath ([string]$service.executable)
        $working = FullLocalPath ([string]$service.workingDirectory)
        if (-not (Test-Path -LiteralPath $program -PathType Leaf) -or -not (Test-Path -LiteralPath $working -PathType Container)) { throw "Missing $name runtime path." }
        if ($service.arguments -isnot [array] -or @($service.arguments | Where-Object { $_ -isnot [string] }).Count -gt 0) { throw 'Service arguments must be a JSON array of strings.' }
        $environment = PropertyOr $service 'environment' $null
        $savedEnvironment = @{}
        try {
            if ($null -ne $environment) {
                foreach ($entry in $environment.PSObject.Properties) {
                    if ($entry.Name -notmatch '^[A-Z][A-Z0-9_]*$' -or $entry.Name -in @('HOME', 'USERPROFILE', 'CODEX_HOME', 'PATH', 'PSMODULEPATH', 'SYSTEMROOT', 'WINDIR') -or $entry.Value -isnot [string]) { throw 'Unsupported model-service environment entry.' }
                    $savedEnvironment[$entry.Name] = [Environment]::GetEnvironmentVariable($entry.Name, 'Process')
                    [Environment]::SetEnvironmentVariable($entry.Name, $entry.Value, 'Process')
                }
            }
            $serviceReceipt = Join-Path $logRoot ($runId + '.' + $name + '.process.json')
            WriteReceipt $serviceReceipt @{ phase = 'dispatching'; name = $name; runId = $runId; executable = $program; workingDirectory = $working }
            $serviceProcess = Start-Process -FilePath $program -ArgumentList (($service.arguments | ForEach-Object { QuoteArgument $_ }) -join ' ') -WorkingDirectory $working -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logRoot ($runId + '.' + $name + '.stdout.log')) -RedirectStandardError (Join-Path $logRoot ($runId + '.' + $name + '.stderr.log'))
            WriteReceipt $serviceReceipt @{ phase = 'running'; name = $name; runId = $runId; pid = $serviceProcess.Id; startedAt = $serviceProcess.StartTime.ToUniversalTime().ToString('o'); executable = $program; workingDirectory = $working }
            Write-Output "$name started as PID $($serviceProcess.Id); ownership receipt retained."
        }
        finally {
            foreach ($key in $savedEnvironment.Keys) { [Environment]::SetEnvironmentVariable($key, $savedEnvironment[$key], 'Process') }
        }
        WaitReady { Healthy $expectedHealth } "$name readiness" $deadline
    }

    $receipt = @{ phase = 'dispatching'; runId = $runId; nodePath = $NodePath; workerPath = $workerPath; configPath = $Config }
    WriteReceipt $receiptPath $receipt
    $worker = Start-Process -FilePath $NodePath -ArgumentList $nodeArgumentText -WorkingDirectory $RuntimeRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logRoot ($runId + '.worker.stdout.log')) -RedirectStandardError (Join-Path $logRoot ($runId + '.worker.stderr.log'))
    $receipt.phase = 'running'
    $receipt.pid = $worker.Id
    $receipt.startedAt = $worker.StartTime.ToUniversalTime().ToString('o')
    WriteReceipt $receiptPath $receipt
    Write-Output "Node worker started as PID $($worker.Id)."
    $worker.WaitForExit()
    $worker.Refresh()
    $exitCode = $worker.ExitCode
    $receipt.phase = 'exited'
    $receipt.exitCode = $exitCode
    $receipt.exitedAt = [datetime]::UtcNow.ToString('o')
    WriteReceipt $receiptPath $receipt
    exit $exitCode
}
catch { Write-Error $_ -ErrorAction Continue; exit 1 }
finally {
    if ($transcribing) { Stop-Transcript | Out-Null }
    if ($null -ne $launcherLock) { $launcherLock.Dispose() }
    # Model servers are shared resources. This launcher never kills them,
    # clears GPU locks, or interprets an old timestamp as proof of termination.
}
