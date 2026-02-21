# RunScript - User Script Manager Extension

A powerful Microsoft Edge extension that allows you to inject arbitrary JavaScript snippets into websites with flexible execution modes and configurations.

## Features

- **Multiple Script Management**: Store and manage unlimited JavaScript snippets
- **Flexible Execution Modes**:
  - **Manual**: Execute scripts on-demand from the popup
  - **Automatic**: Scripts run automatically based on URL patterns
  - **Both**: Combination of manual and automatic execution
- **Execution Contexts**:
  - **MAIN World**: Run in page context with access to window object
  - **Isolated World**: Run in extension's isolated context
- **Configuration Management**:
  - Export/Import configurations to/from JSON files
  - Load configurations from web (auto-updates on extension update)
  - Embed configurations in URLs for sharing
- **Code Editor**: Built-in CodeMirror editor with syntax highlighting

## Installation

1. Open Microsoft Edge
2. Navigate to `edge://extensions`
3. Enable "Developer mode" (toggle in bottom-left)
4. Click "Load unpacked"
5. Select the `RunScript` folder
6. The extension is now installed!

## Usage

### Managing Scripts

1. Click the extension icon to open the popup
2. Click "Settings" to open the options page
3. Click "+ Add Script" to create a new script
4. Configure the script:
   - **Name**: Descriptive name for the script
   - **Execution Mode**: Choose how the script runs
   - **URL Pattern**: For automatic execution (e.g., `*.github.com/*`)
   - **Execution Context**: Choose where the script runs
   - **Code**: Enter your JavaScript code
5. Click "Save" to save the script

### Executing Scripts

**Manual Execution:**
- Click the extension icon (popup)
- Click on any script to execute it
- Only scripts with "Manual" or "Both" mode appear in popup

**Automatic Execution:**
- Scripts automatically execute when you visit matching URLs
- Must be enabled and have "Automatic" or "Both" mode
- Must have a valid URL pattern

### Configuration Management

#### Export Configuration
1. Go to Settings
2. Click "Export to File"
3. A JSON file containing all scripts is downloaded

#### Import Configuration
1. Go to Settings
2. Click "Import from File"
3. Select a previously exported JSON file
4. Existing scripts are overwritten, new ones are added

#### Load from Web
1. Go to Settings
2. Enter the web configuration URL (e.g., `https://example.com/config.json`)
3. Click "Load from Web"
4. Configuration is downloaded and merged

The web URL is automatically loaded when the extension updates.

#### URL Embedding
1. Go to Settings
2. Ensure "Web Configuration URL" is set
3. Click "Generate Embed URL"
4. The base URL with encoded configuration appears
5. Click "Copy" to copy to clipboard
6. Share this URL with others - opening it loads the configuration

## Configuration File Format

Export/Import files use the following JSON structure:

```json
{
  "version": "1.0.0",
  "exported": "2024-02-21T00:00:00.000Z",
  "scripts": {
    "script_1234567890": {
      "name": "Auto Dark Mode",
      "code": "// JavaScript code here",
      "executionMode": "automatic",
      "urlPattern": "*.example.com/*",
      "executionContext": "MAIN",
      "disabled": false,
      "createdAt": "2024-02-21T00:00:00.000Z",
      "updatedAt": "2024-02-21T00:00:00.000Z"
    }
  }
}
```

## URL Patterns

Patterns support wildcards:
- `*` - Matches any sequence of characters
- `?` - Matches a single character
- Examples:
  - `*.github.com/*` - All pages on any subdomain of github.com
  - `https://example.com/*` - All pages on example.com
  - `https://example.com/api/*` - Pages under /api path

## Permission Requirements

- **scripting**: Required to inject scripts into web pages
- **storage**: For storing script configurations
- **activeTab**: To access the current tab for script execution
- **<all_urls>**: To inject scripts into any website

## Tips & Best Practices

1. **Test Carefully**: Test scripts in manual mode first before setting to automatic
2. **Use Appropriate Context**: MAIN world for DOM manipulation, Isolated for isolated scripts
3. **URL Patterns**: Be specific with URL patterns to avoid unintended execution
4. **Backup**: Regularly export your configuration
5. **Share Safely**: Only share embed URLs from trusted configuration sources

## Troubleshooting

### Script doesn't execute automatically
- Verify the script is enabled
- Check the URL pattern matches current page
- Ensure execution mode is "Automatic" or "Both"
- Check browser console for errors

### Manual script doesn't appear in popup
- Verify the script is enabled
- Check execution mode includes "Manual"

### Import fails
- Ensure the JSON file is properly formatted
- Verify the file contains a "scripts" object

## Security Notes

- Scripts execute with the same permissions as the website
- Always review script code before importing from untrusted sources
- MAIN world scripts can be detected and modified by page scripts

## File Structure

```
RunScript/
├── manifest.json       # Extension configuration
├── popup.html         # Popup UI
├── popup.js           # Popup functionality
├── options.html       # Settings page
├── options.js         # Settings functionality
├── background.js      # Background service worker
└── images/            # Icons
```

## Development

The extension uses:
- **CodeMirror**: Code editing with syntax highlighting
- **Chrome Storage API**: Local and sync storage
- **Chrome Scripting API**: Script injection

## Version History

### v1.0.0 (Initial Release)
- Basic script management
- Manual and automatic execution modes
- File import/export
- Web configuration loading
- URL embedding support
