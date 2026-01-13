# Copilot Instructions for Make It Red Extension

## Project Overview
This is a **Zotero extension** (version 2.0) that modifies the Zotero UI to render text and elements in red (or green). It demonstrates core Zotero extension patterns for Firefox-based plugins using the Bootstrapped Extension API.

## Architecture

### Core Extension Flow
1. **bootstrap.js** - Entry point for all extension lifecycle events
   - `startup()` registers preference panes, loads the main module, initializes UI
   - `onMainWindowLoad/Unload()` adds/removes UI elements to individual windows
   - `shutdown()` performs cleanup

2. **make-it-red.js** - Singleton module (`MakeItRed`) managing all UI modifications
   - Lifecycle: `init()` → `addToAllWindows()` → `main()`
   - Tracks added elements by ID in `addedElementIDs[]` to enable clean removal
   - Window-aware: handles multiple Zotero windows separately

3. **Styling & Localization**
   - CSS (style.css): Colors managed via `.row` class + `data-green-instead` attribute
   - Localization (make-it-red.ftl): Uses Fluent format for menu labels

### Key Dependencies
- **Zotero API**: `Zotero.debug()`, `Zotero.PreferencePanes.register()`, `Zotero.getMainWindows()`, `Zotero.Prefs.get()`
- **Firefox Services**: `Services.scriptloader.loadSubScript()`
- **XUL/DOM API**: `createXULElement()`, `createElement()`, `insertFTLIfNeeded()`

## Critical Patterns

### Adding UI Elements
```javascript
let menuitem = doc.createXULElement('menuitem');
menuitem.id = 'unique-id';  // ID required for tracking
menuitem.setAttribute('data-l10n-id', 'ftl-key');
doc.getElementById('parent-element').appendChild(menuitem);
MakeItRed.storeAddedElement(menuitem);  // Always store for cleanup
```

### Cleanup Pattern
Track all added elements by ID and remove them during shutdown to prevent memory leaks and UI duplication on extension reload.

### Accessing Preferences
```javascript
Zotero.Prefs.get('extensions.make-it-red.intensity', true)  // true = global pref
```

## Build & Distribution

### Build Process (make-zips script)
1. Creates `build/` directory
2. Zips all files in `src-2.0/` into `.xpi` file (Firefox extension format)
3. Computes SHA256 hash of XPI
4. Updates `updates-2.0.json` with hash for auto-update mechanism

### Manifest Configuration
- `manifest_version: 2` (Firefox extension v2 format, legacy)
- **Zotero-specific**: Application ID `zotero` with strict version bounds (7.0-7.1.*)
- Update URL points to AWS S3 for auto-updates

## Developer Workflow

### Testing Changes
1. Modify files in `src-2.0/`
2. Reload extension in Zotero (Ctrl+Shift+J to open console, then Tools > Add-ons > Reload)
3. Watch `Zotero.debug()` output in console

### Adding Features
- New UI elements: add to `MakeItRed.addToWindow()` + store element ID
- Localization: add key to `locale/en-US/make-it-red.ftl` + reference with `data-l10n-id`
- Preferences: define in `prefs.js` (default values) + access via `Zotero.Prefs.get()`
- Styling: use `.row` selector or add `data-*` attributes for conditional styles

### Extension Release
1. Run `./make-zips` to build XPI and compute hash
2. Upload XPI to S3
3. Update hash in `updates-2.0.json` on S3
4. Users auto-update within 24 hours

## Conventions & Gotchas

- **Element cleanup is critical**: Failed cleanup causes duplication on reload and memory leaks
- **Window iteration**: Always filter by `win.ZoteroPane` when iterating to skip browser windows
- **XUL vs HTML**: Use `createXULElement()` for Zotero UI, `createElement()` for content
- **Fluent localization**: Must call `insertFTLIfNeeded()` before setting `data-l10n-id` attributes
- **Global Zotero object**: Available globally in all extension scripts (no import needed)
