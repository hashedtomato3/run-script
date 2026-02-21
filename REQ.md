# **Overview**

- An Edge extension that injects arbitrary user scripts into websites.

---

# **Functional Requirements**

- Users can enter and view multiple JavaScript code snippets from the extension’s UI.
- For each JavaScript snippet, the following properties can be configured:
  - Name
  - Execution mode: automatic, manual, or both
  - URL pattern for automatic execution
  - Execution context: MAIN world or Isolated world
  - Enabled / disabled state
- Ability to save and load the above configuration to/from a file via the extension UI.
- Ability to load the configuration from the Web:
  - Target Web address is registered from the extension UI
  - Automatically loaded when the extension is updated
  - Can also be manually loaded from the extension UI
- Ability to embed the configuration into a URL:
  - Embedded in the following format:  
    `https://xxxx.com?q=<configuration>`
  - The `https://xxxx.com?q=` portion is registered from the extension UI
  - Opening the embedded URL in Edge loads the configuration
  - The embedded URL can be displayed in the extension UI

---

# **Details**

### **Saving/Loading Configuration (File, Web, URL Embedding)**

- The configuration is represented as a single JSON object.
- When loading, existing keys are overwritten; new keys are added.

---

# **UI Structure**

### **popup.html**
- Displays script names that can be executed manually; selecting one executes it.
- Includes a button to navigate to `options.html`.
- CSP setting = script-src 'self'

### **options.html**
- Main configuration screen of the extension
- Code input/editing uses a code editor component
- CSP setting = script-src 'self'

---

# **Others**

- The extension is stored inside the `RunScript` folder.
- Use only English



