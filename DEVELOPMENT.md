# ZoteroTray Development Plan

A stepwise implementation guide for building ZoteroTray—a minimize-to-tray feature for Zotero with native Windows helper.

---

## Step 0 — Create a minimal Zotero 7 add-on skeleton

**Goal:** Confirm you can load an add-on and run code at startup.

**Work**

* Create a Zotero 7 bootstrapped add-on (`manifest.json`, `bootstrap.js`).
* In `startup()`, log something to the Zotero debug output.

**Test**

* Zotero: `Help → Debug Output Logging → Restart with Logging`
* Confirm you see a log line like `ZoteroTray: startup` in the Debug Output.

**Pass criteria**

* Add-on installs, enables, and logs on startup; no errors in debug output.

---

## Step 1 — Verify you can attach to the main Zotero window reliably

**Goal:** Ensure you can get the main window reference and add listeners.

**Work**

* In `onMainWindowLoad({window})`, log:

  * window title
  * `window.location.href`
  * a unique "listener installed" line

**Test**

* Restart Zotero.
* Confirm logs show the main window loaded once and listener installed.

**Pass criteria**

* You can consistently run code with the correct Zotero main window object (no null, no wrong window).

---

## Step 2 — Intercept the close button ("X") without breaking real quit

**Goal:** Prove you can listen to the close event and prevent shutdown.

**Work**

* Add a capturing `close` event listener on the main window:

  * If shutting down: do nothing.
  * Otherwise: `preventDefault()` and log "close intercepted".

**Tests**

1. **Click X**

   * Expected: Zotero stays running; log shows "close intercepted".
2. **File → Quit**

   * Expected: Zotero exits normally (no interception log, or log indicates you allowed shutdown).
3. **Alt+F4**

   * Expected: same as X (intercepted).
4. **Taskbar close (right-click icon → Close window)**

   * Expected: intercepted.

**Pass criteria**

* All "user-close" paths are intercepted.
* "Real quit" paths still exit.

---

## Step 3 — Implement "hide" behavior without tray icon yet

**Goal:** Make X behave like "hide window".

**Work**

* In the close handler, after interception:

  * call a window-hide method (initially simplest: `window.minimize()` or equivalent)
  * log "hiding".

(You may need a platform-specific call to fully hide rather than minimize; treat this step as a functional placeholder.)

**Tests**

1. Click X → window disappears/minimizes as intended.
2. Confirm Zotero is still running:

   * Check Task Manager or reopen via Start menu shortcut.
3. File → Quit still works.

**Pass criteria**

* Close does not quit; Zotero remains running in background in a predictable state.

---

## Step 4 — Build the tray helper as a standalone Win32 executable

**Goal:** Prove the native helper works independently (Traymond-style).

**Work**

* Build helper that:

  * creates a tray icon
  * right-click menu: Exit
  * double-click: show a MessageBox ("Restore triggered")

**Tests**

1. Run helper manually.

   * Expected: tray icon appears.
2. Double-click tray icon.

   * Expected: MessageBox pops.
3. Right-click tray icon → Exit

   * Expected: helper quits, tray icon removed.
4. Restart Explorer (optional):

   * Kill and restart `explorer.exe`.
   * Expected: tray icon returns (if you implemented TaskbarCreated).

**Pass criteria**

* Helper tray icon lifecycle is stable and doesn't leave ghost icons.

---

## Step 5 — Helper can show/hide an arbitrary HWND (manual test program)

**Goal:** Validate Win32 window manipulation before touching Zotero.

**Work**

* Create a tiny test window app (`dummy_window.exe`) that opens a normal window.
* Extend helper to accept `--hwnd=0x...` and implement:

  * "Show/Hide" menu item toggles that HWND via `ShowWindow`.
  * double-click restores.

**Tests**

1. Start dummy window.
2. Start helper with dummy HWND.
3. Use tray menu Show/Hide repeatedly.

   * Expected: dummy window hides and restores correctly.
4. Double-click tray icon.

   * Expected: dummy window restores and foreground.

**Pass criteria**

* Helper correctly controls a known HWND without crashes.

---

## Step 6 — Get Zotero's HWND from the plugin and log it

**Goal:** Confirm your plugin can obtain the correct native window handle.

**Work**

* In `onMainWindowLoad`, extract HWND (via `nsIBaseWindow.nativeHandle` or equivalent) and log it.

**Tests**

1. Restart Zotero; confirm a plausible non-zero HWND printed.
2. Sanity check: log should remain constant across operations until restart.

**Pass criteria**

* You consistently obtain an HWND that can be used externally.

---

## Step 7 — Start helper from Zotero plugin (no IPC yet)

**Goal:** Confirm the add-on can extract and launch the helper exe.

**Work**

* Bundle helper exe inside the add-on.
* On startup:

  * extract helper to a stable per-profile directory
  * run it with args `--hwnd=<zotero_hwnd> --ppid=<zotero_pid> --pipe=<name>` (pipe unused for now)

**Tests**

1. Restart Zotero.

   * Expected: helper appears in system tray automatically.
2. Verify only one helper instance:

   * restart Zotero; helper should restart once, not duplicate.
3. Quit Zotero normally (File → Quit):

   * Expected: helper exits automatically (via parent PID watcher).

**Pass criteria**

* Launch, single-instance, and shutdown behavior are correct.

---

## Step 8 — Implement one-way IPC: plugin → helper (HIDE/SHOW)

**Goal:** Make the close interception trigger helper actions.

**Work**

* Implement named pipe server in helper (already in the design).
* Implement minimal pipe client call from plugin:

  * Send `HIDE\n` on close interception.
  * Send `SHOW\n` on explicit restore action (temporary: a keyboard shortcut inside Zotero or menu item).

**Tests**

1. Start Zotero; tray icon present.
2. Click X:

   * Expected: plugin intercepts close, sends `HIDE`, Zotero window disappears.
3. Restore:

   * Use your temporary restore path to send `SHOW`.
   * Expected: Zotero window reappears and foreground.
4. Spam close/restore 20x:

   * Expected: no hangs, no orphan states.

**Pass criteria**

* Close reliably hides via helper every time.
* Restore reliably shows every time.

---

## Step 9 — Implement helper-driven restore (tray UX complete)

**Goal:** Double-click tray icon restores Zotero without needing plugin UI.

**Work**

* In helper:

  * double-click: `ShowWindow(hwnd, SW_RESTORE)` + `SetForegroundWindow(hwnd)`
* Optional: right-click menu item "Show/Hide Zotero".

**Tests**

1. Hide Zotero via X.
2. Double-click tray icon:

   * Expected: Zotero restores and takes focus.
3. Right-click menu Show/Hide:

   * Expected: toggles reliably.
4. Restore after Zotero was minimized vs hidden:

   * Expected: still restores.

**Pass criteria**

* Fully Traymond-like user experience.

---

## Step 10 — Implement "Quit Zotero" path and ensure it truly quits

**Goal:** A tray menu "Quit Zotero" must exit Zotero (not just hide).

**Work**

* Helper tray menu "Quit Zotero":

  * send `WM_CLOSE` to Zotero HWND (or send IPC message that plugin interprets as "quit now").
* Plugin must allow quit:

  * When `Services.startup.shuttingDown` is true, do not intercept.
  * If using WM_CLOSE from helper, provide a plugin-side "quitting flag" so the next close isn't intercepted.

**Tests**

1. Hide Zotero.
2. Tray menu → Quit Zotero:

   * Expected: Zotero exits, helper exits shortly after (parent watcher).
3. File → Quit works.
4. Ensure "Quit Zotero" doesn't just hide again.

**Pass criteria**

* Quit is deterministic and never loops back into hide.

---

## Step 11 — Robustness tests (the ones that catch real-world failures)

**A) Crash/orphan handling**

* Force kill Zotero process while hidden.

  * Expected: helper exits automatically (no orphan).

**B) Explorer restart**

* Restart Explorer while Zotero hidden.

  * Expected: tray icon is re-added; restore still works.

**C) Startup timing**

* Start Zotero; immediately click X during startup.

  * Expected: no race crash; eventually tray icon exists; window hides.

**D) Multiple Zotero restarts**

* Restart Zotero 10 times.

  * Expected: no accumulation of helper processes; no stale extracted exes.

**E) AV/SmartScreen friction (practical)**

* On a clean Windows VM, run Zotero with your plugin installed.

  * Expected: helper launches without alarming prompts (if unsigned, you may see prompts; record).

**Pass criteria**

* No orphan helper, no lost tray icon, no dead restore.

---

## Step 12 — Packaging and release readiness

**Goal:** Make updates smooth and avoid "stale helper".

**Work**

* Version the extracted helper (e.g., include version in filename or compare hash).
* On add-on update, replace helper cleanly.
* Add preferences:

  * enable/disable "close to tray"
  * enable/disable "start helper at launch"
  * optional hotkey

**Tests**

1. Install v1, then install v2 over it.

   * Expected: helper updates and still works.
2. Disable add-on:

   * Expected: helper stops and tray icon removed.
3. Re-enable add-on:

   * Expected: helper returns.

**Pass criteria**

* Predictable install/update/uninstall lifecycle.

---

## Minimal instrumentation

* A `ZoteroTray.debug(msg)` function that logs to Debug Output.
* A helper log file in `%LOCALAPPDATA%\ZoteroTray\helper.log` for IPC commands and errors.
* A "status" command from plugin to helper (optional) to confirm helper is alive.

---

## Progress Tracking

Track completion of each step here:

- [ ] Step 0: Minimal add-on skeleton with startup log
- [ ] Step 1: Main window attachment and listener
- [ ] Step 2: Close button interception
- [ ] Step 3: Hide behavior without tray icon
- [ ] Step 4: Native helper tray icon (standalone)
- [ ] Step 5: Helper HWND control (test program)
- [ ] Step 6: Extract Zotero HWND
- [ ] Step 7: Launch helper from plugin
- [ ] Step 8: One-way IPC (HIDE/SHOW)
- [ ] Step 9: Helper-driven restore (full tray UX)
- [ ] Step 10: Quit path and cleanup
- [ ] Step 11: Robustness tests
- [ ] Step 12: Packaging and release readiness
