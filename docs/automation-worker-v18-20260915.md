# Corrected-cast worker activation — September 15, 2026

The owner explicitly approved updating the cartoon worker’s startup
configuration. The cloud had no running jobs, and the PC reported fresh idle
status before the upgrade. Other GPU work was not stopped.

## Installed

- Runtime: `Z:\ImageGenerator\CartoonRuntime\releases\20260915-v18`
- Configuration: `Z:\ImageGenerator\CartoonRuntime\config\worker-v18.json`
- Task: `SwingingDoor-CartoonWorker`, same user, S4U, Limited privileges.
- Boot, user-logon, and recovery triggers remain enabled; `IgnoreNew` prevents
  overlapping scheduled instances. No password, reboot, power-setting change,
  or automatic Windows login was involved.
- Existing durable state and worker token were preserved. The previous task XML
  is retained in the new runtime’s `task-backups` directory.
- All 36 pinned runtime/canon files passed verification. All five acting PNGs
  matched the approved reference-v2 verification hashes. The approved head hash
  begins `ab76ccbf36c54b1b`.
- Sharp 0.35.4 and opentype.js 2.0.0 were installed in the separate runtime with
  a package lock. The approved 1024 × 1536 acting image decoded successfully.

## Corrected behavior

The runtime retains the owner-approved Barclay head and explicitly records its
identity, head, and acting-pose hashes in each production report. The website
checks these before allowing human approval.

The independent editor must explain the reader’s insight, the TV connection,
and the chalkboard contribution. Format-only praise no longer passes. The
earlier Chicago line and incomplete ranking are regression-test examples of
work that must be rejected. Scores remain fallible model judgments, not reader
ratings; the separate human approval requirement always applies.

## Observed checks

- Previous idle Node worker PID 44864 exited; replacement PID 37876 started
  from the v18 task at 16:45:17 UTC.
- Cloud worker heartbeat was confirmed at 16:45:30 UTC; the new process returned
  to idle after authenticated queue access.
- Existing ComfyUI listener PID 27664 remained unchanged.
- Missing Ollama service was started on loopback port 11435 (PID 37868), without
  launching an inference job. All three configured local models were present.
- Worker/editor/GPU-recovery tests: 27 passed, using isolated fixtures. These
  include an actual killed test-process recovery, not a workstation reboot.

No new production cartoon was generated or published during this activation.
A complete new-render trial through the updated worker remains outstanding.
Boot triggers are configured; a real PC restart/power-loss test remains the
owner’s planned after-hours check. No claim of tested firmware power recovery
or first-pass editorial quality is made.
