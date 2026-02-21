# RunScript Development Guide

## Architecture Overview

RunScript is a Microsoft Edge extension with the following architecture:

### File Structure

```
RunScript/
├── manifest.json              # Extension manifest (v3)
├── popup.html / popup.js      # Extension popup UI
├── options.html / options.js  # Settings/configuration page
├── background.js              # Service worker for extension lifecycle
├── utils.js                   # Utility functions
├── example-config.json        # Example configuration file
├── README.md                  # User documentation
└── images/                    # Extension icons
```

### Component Responsibilities

#### manifest.json
- Declares extension metadata and permissions
- Specifies entry points (popup, options, content script, background worker)
- Defines host permissions and API access

#### popup.html / popup.js
- Displays list of scripts available for manual execution
- Allows quick execution of enabled scripts
- Provides access to settings page
- Respects CSP: script-src 'self'

#### options.html / options.js
- Main configuration interface
- Script editor with CodeMirror
- Configuration import/export
- Web configuration management
- URL embedding utilities
- Respects CSP: script-src 'self'

#### background.js
- Service worker for extension lifecycle
- Handles install/update events
- Auto-loads web configurations on update
- Processes embedded URL configurations
- Routes messages between components

#### utils.js
- URL pattern matching (`UrlPatternMatcher`)
- Configuration management (`ConfigManager`)
- Script execution utilities (`ScriptExecutor`)
- Storage helpers (`StorageUtil`)

## Storage Model

### Local Storage (`chrome.storage.local`)
Stores user scripts and configurations.

**Key: `scripts`**
```javascript
{
  "script_1234567890": {
    "name": "Script Name",
    "code": "// JavaScript code",
    "executionMode": "manual" | "automatic" | "both",
    "urlPattern": "*.example.com/*",
    "executionContext": "MAIN" | "Isolated",
    "disabled": false,
    "createdAt": "ISO string",
    "updatedAt": "ISO string"
  }
}
```

### Sync Storage (`chrome.storage.sync`)
Stores user preferences synced across Edge devices.

**Keys:**
- `webConfigUrl`: URL to configuration JSON file

## Execution Modes

### Manual
- Scripts appear in popup
- User explicitly clicks to execute
- Executes immediately in current tab

### Automatic
- Scripts execute when page loads
- URL pattern must match current page URL
- Script must be enabled

## Execution Contexts

### MAIN World
- Executes in web page's JavaScript context
- Has access to window object and page globals
- Can access/modify DOM
- Can interact with page scripts (both visibility and functionality)
- Injected via `<script>` tag

### Isolated World
- Executes in extension's isolated context
- Limited access to page (DOM only)
- Cannot access window or page globals
- Cannot interact with page scripts
- More secure but limited functionality

## URL Pattern Matching

Patterns support Unix-style wildcards:

- `*` - Matches any sequence of characters (including `/`)
- `?` - Matches exactly one character

Examples:
- `*.github.com/*` - Matches any GitHub domain
- `https://example.com/api/*` - Matches API paths on example.com
- `*localhost*` - Matches any URL containing localhost
- `https://example.com/page?.html` - Matches page1.html, pageA.html, etc.

## Configuration Format

### Standard Configuration File
```json
{
  "version": "1.0.0",
  "exported": "2024-02-21T00:00:00.000Z",
  "webConfigUrl": "https://example.com/config.json",
  "embedBaseUrl": "https://example.com?q=",
  "scripts": {
    "script_id": {
      "name": "Script Name",
      "code": "...",
      "executionMode": "manual|automatic|both",
      "urlPattern": "...",
      "executionContext": "MAIN|Isolated",
      "disabled": false,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Configuration Attributes:**
- `version`: Configuration format version
- `exported`: Timestamp when exported
- `webConfigUrl`: URL for automatic web configuration loading
- `embedBaseUrl`: Base URL for URL embedding
- `scripts`: Collection of user scripts

### URL Embedding
Configuration is encoded as base64 and appended to base URL:

```
https://example.com?q=<base64-encoded-config>
```

## API Reference

### Chrome APIs Used

```javascript
// Permissions required
chrome.scripting          // Execute scripts in tabs
chrome.storage.local      // Store user scripts
chrome.storage.sync       // Store synced preferences
chrome.runtime            // Extension lifecycle, messaging
chrome.tabs               // Tab management
chrome.permissions        // Permission checking
```

### Message Passing

**From Popup to Content:**
```javascript
chrome.runtime.sendMessage({
  action: 'executeScript',
  code: '...'
});
```

**Content Response:**
```javascript
sendResponse({ success: true, error: null });
```

## Development Workflow

### 1. Loading Extension in Edge

1. Open `edge://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the RunScript folder

### 2. Making Changes

- HTML/CSS changes: Refresh popup (Alt+R or reload in dev tools)
- JavaScript changes: Close and reopen popup/options
- Manifest changes: Reload extension

### 3. Debugging

- **Popup/Options**: Inspect via right-click → Inspect
- **Content Script**: Open page console (F12)
- **Background Worker**: chrome://extensions → Details → Service worker → Inspect

### 4. Testing

Manual testing checklist:
- [ ] Create new script
- [ ] Save script with all settings
- [ ] Execute manual script from popup
- [ ] Test automatic execution with URL patterns
- [ ] Test both execution contexts
- [ ] Export configuration
- [ ] Import configuration
- [ ] Load from web (requires test server)
- [ ] Generate and test embed URL
- [ ] Disable/enable scripts

## Common Issues & Solutions

### Scripts Not Executing Automatically
1. Check script is enabled
2. Verify URL pattern matches page URL
3. Verify execution mode includes "automatic"
4. Check console for errors

### Code Not Appearing in Editor
1. Refresh the options page
2. Select the script again
3. Check browser console for errors

### Embed URL Not Working
1. Ensure base URL is set
2. Verify configuration is valid JSON
3. Check URL encoding (base64)
4. Verify tab is detecting URL parameter

### Storage Issues
1. Clear extension data: chrome://extensions → Details → Storage
2. Re-import configuration

## Performance Considerations

1. **Content Script Size**: Keep individual scripts optimized
2. **Auto-execution**: Use specific URL patterns to limit overhead
3. **Storage**: Large scripts (~1MB) stored in local storage
4. **Injection Method**: MAIN world injection is slightly slower but more compatible

## Security Best Practices

1. **Validate User Input**: Always validate script code and patterns
2. **URL Patterns**: Use specific patterns to prevent unintended execution
3. **MAIN vs Isolated**: Use MAIN for DOM manipulation, Isolated for isolation
4. **CSP**: Content Security Policy limits inline scripts (enforced in manifest)
5. **Permissions**: Only request necessary permissions

## Future Enhancement Ideas

1. **Script Library**: Community-shared script repository
2. **Conditional Execution**: More complex conditions than URL matching
3. **Script Dependencies**: Support for script dependencies/imports
4. **Cloud Sync**: Optional cloud storage integration
5. **Backup/Restore**: Automated configuration backups
6. **Performance Metrics**: Track script execution time/errors
7. **Script Versioning**: Version control for scripts
8. **Testing Framework**: Built-in testing/validation

## Browser Compatibility

- Primary: Microsoft Edge (Chromium-based)
- Secondary: Chrome, Brave, Opera (should work with minor adjustments)
- Not compatible: Firefox (would need manifest.json v2 conversion)

## Useful Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [CodeMirror Docs](https://codemirror.net/5/)
- [Edge Extension Documentation](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/)
