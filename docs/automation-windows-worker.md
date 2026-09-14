# Persistent Windows cartoon worker

These scripts prepare a Task Scheduler installation for the existing Windows GPU workstation. They do not install anything merely by being committed or deployed to Vercel. The implementation was prepared without registering tasks, starting processes, stopping model servers, changing power settings, or collecting Windows credentials.

Use a stable, separately staged runtime such as `Z:\ImageGenerator\CartoonRuntime`, containing the worker, launcher and required pipeline dependencies. Do not point a permanent task at a temporary release worktree. The runtime configuration and bearer-token file belong outside Git; restrict their access to the intended worker user, administrators and SYSTEM. The installer does not grant access or copy the repository, models, secrets, or assets.

## Boot and security context

The default `BootS4U` mode registers boot, current-user logon and five-minute recovery triggers. Registration must run in an elevated PowerShell window under the same intended user; the task itself uses **Limited** privileges. It collects no password and enables no automatic Windows login. The installer initially creates a **disabled** task. `-Enable` is an explicit installation choice, not the default, and no immediate task start is requested by the script.

Microsoft requires administrator privileges to create a boot trigger. S4U stores no Windows password, but Microsoft documents restrictions on network and encrypted-file access; do not assume a signed-in test establishes S4U behavior. Test the actual noninteractive task's raw HTTPS with application authentication, local file access, model access and GPU inference before enabling ongoing work. Windows-integrated network authentication, mapped shares and encrypted files must not be dependencies. See [Microsoft task registration](https://learn.microsoft.com/en-us/windows/win32/taskschd/taskfolder-registertask) and [task security contexts](https://learn.microsoft.com/en-us/windows/win32/taskschd/security-contexts-for-running-tasks).

The explicit `Logon` mode uses the current interactive token and can be prepared without elevation. It runs only while that user is signed in and **does not satisfy recovery before login**. The scripts never fall back to SYSTEM or another account. If the S4U test fails, stop and report the precise dependency; a different service identity/runtime arrangement needs separate review.

Read-only workstation inspection on September 14, 2026 found:

- User `AIDB-LAB\admin`, SID `S-1-5-21-3396089734-2691041427-2338207367-1002`; current shell was not elevated.
- `Z:` is the local fixed `Data_Drive`, not a mapped network drive.
- Ollama was serving `127.0.0.1:11435` from `Z:\ImageGenerator\local-studio\ollama-v0.34.0\ollama.exe`.
- ComfyUI was serving `127.0.0.1:8188` from `Z:\ComfyUI\main.py`, launched through `Z:\ComfyUI\.venv\Scripts\python.exe`.
- That ComfyUI venv resolves its interpreter to `C:\Users\admin\AppData\Roaming\uv\python\cpython-3.12.9-windows-x86_64-none`. Its ACL permits only the user, administrators and SYSTEM, so LocalService cannot use this existing runtime without a separately reviewed change.
- No matching Ollama, ComfyUI, Cartoon or Studio scheduled task was found. Existing model startup scripts are manual. `Z:\ImageGenerator\start-studio.ps1` also starts AuraVision; the new launcher does not invoke it.

These are inspection findings, not evidence that boot startup or S4U inference has passed. The account, paths and permissions must be rechecked if the runtime moves.

## Local launcher configuration

The Node worker consumes its normal configuration. The optional `windowsLauncher` object is interpreted only by the PowerShell launcher; the Node parser tolerates it. It is trusted local configuration, never a cloud job field. In addition to the worker's `apiOrigin`, `workerId`, `tokenFile`, `workspaceRoot`, `stateRoot` and runtime pins, the Windows configuration may contain:

```json
{
  "windowsLauncher": {
    "startupTimeoutSeconds": 600,
    "requireGpu": true,
    "modelServices": [
      {
        "name": "ollama",
        "executable": "Z:\\ImageGenerator\\local-studio\\ollama-v0.34.0\\ollama.exe",
        "arguments": ["serve"],
        "workingDirectory": "Z:\\ImageGenerator\\local-studio",
        "port": 11435,
        "healthUrl": "http://127.0.0.1:11435/api/tags",
        "environment": {
          "OLLAMA_HOST": "127.0.0.1:11435",
          "OLLAMA_MODELS": "Z:\\ai-models\\ollama",
          "OLLAMA_NO_CLOUD": "1",
          "OLLAMA_KEEP_ALIVE": "0",
          "OLLAMA_MAX_LOADED_MODELS": "1",
          "OLLAMA_NUM_PARALLEL": "1",
          "OLLAMA_CONTEXT_LENGTH": "32768",
          "OLLAMA_FLASH_ATTENTION": "1",
          "OLLAMA_KV_CACHE_TYPE": "q8_0"
        }
      },
      {
        "name": "comfyui",
        "executable": "Z:\\ComfyUI\\.venv\\Scripts\\python.exe",
        "arguments": ["main.py", "--listen", "127.0.0.1", "--port", "8188", "--disable-auto-launch", "--preview-method", "none"],
        "workingDirectory": "Z:\\ComfyUI",
        "port": 8188,
        "healthUrl": "http://127.0.0.1:8188/system_stats"
      }
    ]
  }
}
```

Set `windowsLauncher.readinessUrl` to an exact deployed HTTPS endpoint that returns 200 without credentials if startup must wait for network readiness. It accepts no query, fragment, redirects or embedded credentials. The worker's normal authenticated requests remain responsible for proving application access and retrying later outages. The launcher waits up to ten minutes for the fixed drive/config, then uses bounded exponential backoff for the configured HTTPS check, NVIDIA driver and model health. No browser, desktop session or paid model download is involved.

The launcher starts only services whose ports are free. Healthy existing listeners are reused unchanged. An occupied but unhealthy port is allowed time to become healthy, then produces a visible startup failure; it never triggers a duplicate server, service restart or process kill. Neither bootstrap nor uninstall stops Ollama, ComfyUI, AuraVision, other GPU jobs, or clears cooperative GPU leases.

## Prepare, inspect and install

After staging and reviewing the stable runtime/configuration, an ordinary shell can preview the exact task setup without changing Task Scheduler:

```powershell
& 'Z:\ImageGenerator\CartoonRuntime\scripts\automation\install-worker.ps1' -RuntimeRoot 'Z:\ImageGenerator\CartoonRuntime' -Config 'Z:\ImageGenerator\CartoonRuntime\config\worker.json' -Mode BootS4U -WhatIf
```

After the owner approves UAC, run the same command in an elevated Windows PowerShell window for `AIDB-LAB\admin`, omitting `-WhatIf`. It registers a disabled task named `\SwingingDoor-CartoonWorker`, using `C:\Program Files\nodejs\node.exe` by default. No runtime is executed elevated and no task is immediately started by the installer. Use `-NodePath` for an explicitly staged alternative Node 22+ executable.

The existing-task path requires both an identical user/runtime/config/Node identity and explicit `-UpdateExisting`. A different task with the same name is refused. Updating a running worker task is refused. Replacing the definition first retains its exact XML under `RuntimeRoot\task-backups`. After successful task-context verification, registration with `-UpdateExisting -Enable` deliberately enables its triggers.

Task settings use `IgnoreNew`, no execution time limit, three one-minute failure restarts, and an indefinite five-minute trigger that provides later recovery opportunities. A machine-level runtime lock and the worker's own singleton prevent overlap. No wake, sleep, hibernation, global execution-policy or power-plan setting is changed. The hidden process launch is explicit; the scheduled task remains visible in Task Scheduler for inspection.

## Verification and recovery

Before claiming unattended operation, complete a bounded task-context test that proves actual worker authentication, reads the pinned pipeline/model files, observes the GPU, processes one approved pilot occurrence, uploads its exact assets and reports its final status. Repeat a delivery and a supervisor failure to verify no duplicate edition or overlapping worker. Check stored boot/S4U/Limited settings and retained logs. A configuration check without reboot cannot prove that firmware, drive availability or Windows startup will behave correctly after total power loss.

The launcher writes unique stdout/stderr/transcript logs and process receipts under `RuntimeRoot\logs\worker`. It retains child PID, start time, executable and working-directory provenance; it never logs token-file contents or model-service environment values. If the PowerShell supervisor dies while Node survives, the next launch identifies the exact Node command and preserves it. Node independently refuses a second live worker. A failed generation remains governed by the worker/pipeline's durable state and lease rules; a process restart is not permission to resubmit uncertain inference.

To prevent future task starts without interrupting running work:

```powershell
& 'Z:\ImageGenerator\CartoonRuntime\scripts\automation\uninstall-worker.ps1' -RuntimeRoot 'Z:\ImageGenerator\CartoonRuntime' -Config 'Z:\ImageGenerator\CartoonRuntime\config\worker.json'
```

This backs up and disables only the matching task. Pause production through its normal control and let the worker exit cleanly. Repeat with `-RemoveTask` when it is no longer running to unregister it. Runtime files, config, tokens, logs, state and model processes are retained. The XML backup supports reviewed restoration; S4U requires the same identity and privileges at restoration. There is no automatic cleanup that can terminate a shared model process.

Power-loss recovery also depends on firmware configured to restore AC power and any disk-unlock behavior permitting unattended startup. Firmware settings, BitLocker preboot prompts and the computer's sleep/power policy are outside this installer. Discuss those with the owner before claiming end-to-end power-loss recovery; the scripts make no changes to them.
