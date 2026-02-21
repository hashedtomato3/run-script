// options.js

let currentScriptId = null;
let editor = null;

document.addEventListener('DOMContentLoaded', () => {
  initializeEditor();
  loadScriptsList();
  setupEventListeners();
  setupModalListeners();
  loadWebConfigUrl();
});

function initializeEditor() {
  const textarea = document.getElementById('scriptCode');
  editor = CodeMirror.fromTextArea(textarea, {
    mode: 'javascript',
    theme: 'material',
    //lineNumbers: true,
    indentUnit: 2,
    tabSize: 2,
    indentWithTabs: false,
    lineWrapping: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
    highlightSelectionMatches: { showToken: /\w/, annotateScrollbar: true }
  });
}

async function loadScriptsList() {
  const result = await chrome.storage.local.get('scripts');
  const scripts = result.scripts || {};
  
  const scriptsList = document.getElementById('scriptsList');
  scriptsList.innerHTML = '';

  Object.entries(scripts)
    .sort(([_, a], [__, b]) => a.name.localeCompare(b.name))
    .forEach(([scriptId, script]) => {
      const li = document.createElement('li');
      li.className = 'script-list-item';
      if (script.disabled) {
        li.classList.add('disabled');
      }
      
      // Script name span
      const nameSpan = document.createElement('span');
      nameSpan.className = 'script-name';
      nameSpan.textContent = script.name;
      
      // Enabled toggle
      const toggleLabel = document.createElement('label');
      toggleLabel.className = 'script-toggle';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !script.disabled;
      checkbox.title = 'Check to enable script';
      checkbox.setAttribute('data-script-id', scriptId);
      checkbox.addEventListener('change', toggleScriptEnabled);
      checkbox.addEventListener('click', (e) => e.stopPropagation());
      
      toggleLabel.appendChild(checkbox);
      
      li.appendChild(nameSpan);
      li.appendChild(toggleLabel);
      li.dataset.scriptId = scriptId;
      
      li.addEventListener('click', () => selectScript(scriptId));
      scriptsList.appendChild(li);
    });
}

async function toggleScriptEnabled(event) {
  const scriptId = event.target.getAttribute('data-script-id');
  const isChecked = event.target.checked;
  
  const result = await chrome.storage.local.get('scripts');
  const scripts = result.scripts || {};
  
  if (scripts[scriptId]) {
    scripts[scriptId].disabled = !isChecked;
    await chrome.storage.local.set({ scripts });
    
    // Update UI
    const listItem = document.querySelector(`[data-script-id="${scriptId}"]`);
    if (isChecked) {
      listItem.classList.remove('disabled');
    } else {
      listItem.classList.add('disabled');
    }
  }
}

function selectScript(scriptId) {
  currentScriptId = scriptId;
  
  // Update active state in list
  document.querySelectorAll('.script-list-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-script-id="${scriptId}"]`).classList.add('active');

  // Load script data
  chrome.storage.local.get('scripts', (result) => {
    const scripts = result.scripts || {};
    const script = scripts[scriptId];
    
    if (script) {
      document.getElementById('scriptName').value = script.name;
      
      // Set execution mode checkboxes based on new numeric flags (0/1) with legacy fallback
      const execManual = script.executionModeManual;
      const execAutomatic = script.executionModeAutomatic;
      document.getElementById('executionModeManual').checked = execManual;
      document.getElementById('executionModeAutomatic').checked = execAutomatic;
      
      // Update URL pattern visibility
      updateUrlPatternVisibility();
      
      document.getElementById('urlPattern').value = script.urlPattern || '';
      document.getElementById('executionContext').value = script.executionContext || 'MAIN';
      editor.setValue(script.code || '');
      
      document.getElementById('emptyEditor').style.display = 'none';
      document.getElementById('scriptEditor').style.display = 'block';
    }
  });
}

function updateUrlPatternVisibility() {
  const isAutomatic = document.getElementById('executionModeAutomatic').checked;
  const urlPatternGroup = document.getElementById('urlPatternGroup');
  urlPatternGroup.style.display = isAutomatic ? 'block' : 'none';
}

function setupEventListeners() {
  // Script management
  document.getElementById('addScriptBtn').addEventListener('click', addNewScript);
  document.getElementById('saveScriptBtn').addEventListener('click', saveScript);
  document.getElementById('deleteScriptBtn').addEventListener('click', deleteScript);
  
  // Execution mode checkboxes
  document.getElementById('executionModeManual').addEventListener('change', updateUrlPatternVisibility);
  document.getElementById('executionModeAutomatic').addEventListener('change', updateUrlPatternVisibility);
  
  // Configuration tabs
  document.querySelectorAll('.config-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => switchConfigTab(e.target.dataset.tab));
  });
  
  // File management
  document.getElementById('exportBtn').addEventListener('click', exportConfiguration);
  document.getElementById('importBtn').addEventListener('click', importConfiguration);
  document.getElementById('fileInput').addEventListener('change', handleFileImport);
  
  // Web management
  document.getElementById('webConfigUrl').addEventListener('change', () => {
    const url = document.getElementById('webConfigUrl').value;
    chrome.storage.sync.set({ webConfigUrl: url });
  });
  document.getElementById('loadWebBtn').addEventListener('click', loadFromWeb);
  
  // URL embed management
  document.getElementById('embedBaseUrl').addEventListener('change', () => {
    const url = document.getElementById('embedBaseUrl').value;
    chrome.storage.sync.set({ embedBaseUrl: url });
  });
  document.getElementById('generateEmbedBtn').addEventListener('click', generateEmbedUrl);
  document.getElementById('copyEmbedBtn').addEventListener('click', copyEmbedUrl);
}

function setupModalListeners() {
  const configManagementBtn = document.getElementById('configManagementBtn');
  const configModal = document.getElementById('configModal');
  const configModalOverlay = document.getElementById('configModalOverlay');
  const configModalCloseBtn = document.getElementById('configModalCloseBtn');

  // Open modal
  configManagementBtn.addEventListener('click', () => {
    configModal.classList.add('active');
    configModalOverlay.classList.add('active');
  });

  // Close modal via close button
  configModalCloseBtn.addEventListener('click', () => {
    configModal.classList.remove('active');
    configModalOverlay.classList.remove('active');
  });

  // Close modal via overlay click
  configModalOverlay.addEventListener('click', () => {
    configModal.classList.remove('active');
    configModalOverlay.classList.remove('active');
  });
}

async function addNewScript() {
  const result = await chrome.storage.local.get('scripts');
  const scripts = result.scripts || {};
  
  const scriptId = `script_${Date.now()}`;
  scripts[scriptId] = {
    name: 'New Script',
    code: '',
    executionModeManual: true,
    executionModeAutomatic: false,
    urlPattern: '',
    executionContext: 'MAIN',
    disabled: false,
    createdAt: new Date().toISOString()
  };
  
  await chrome.storage.local.set({ scripts });
  
  await loadScriptsList();
  selectScript(scriptId);
}

async function saveScript() {
  if (!currentScriptId) {
    showStatus('error', 'No script selected');
    return;
  }

  const name = document.getElementById('scriptName').value.trim();
  if (!name) {
    showStatus('error', 'Script name cannot be empty');
    return;
  }

  // Determine execution mode from checkboxes; store as false/true flags
  const isManual = document.getElementById('executionModeManual').checked;
  const isAutomatic = document.getElementById('executionModeAutomatic').checked;

  const result = await chrome.storage.local.get('scripts');
  const scripts = result.scripts || {};
  
  scripts[currentScriptId] = {
    ...scripts[currentScriptId],
    name,
    executionModeManual: isManual,
    executionModeAutomatic: isAutomatic,
    urlPattern: document.getElementById('urlPattern').value,
    executionContext: document.getElementById('executionContext').value,
    code: editor.getValue(),
    updatedAt: new Date().toISOString()
  };

  await chrome.storage.local.set({ scripts });
  await loadScriptsList();
  selectScript(currentScriptId);
  
  showStatus('success', 'Script saved successfully');
}

async function deleteScript() {
  if (!currentScriptId) {
    showStatus('error', 'No script selected');
    return;
  }

  if (!confirm('Are you sure you want to delete this script?')) {
    return;
  }

  const result = await chrome.storage.local.get('scripts');
  const scripts = result.scripts || {};
  
  delete scripts[currentScriptId];
  await chrome.storage.local.set({ scripts });
  
  currentScriptId = null;
  await loadScriptsList();
  
  document.getElementById('emptyEditor').style.display = 'block';
  document.getElementById('scriptEditor').style.display = 'none';
  
  showStatus('success', 'Script deleted');
}

// Configuration tab management
function switchConfigTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.config-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.config-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(tabName).classList.add('active');
}

async function exportConfiguration() {
  const result = await chrome.storage.local.get('scripts');
  const scripts = result.scripts || {};
  
  const syncResult = await chrome.storage.sync.get(['webConfigUrl', 'embedBaseUrl']);
  
  const config = {
    version: '1.0.0',
    exported: new Date().toISOString(),
    webConfigUrl: syncResult.webConfigUrl || '',
    embedBaseUrl: syncResult.embedBaseUrl || '',
    scripts: scripts
  };
  
  const dataStr = JSON.stringify(config, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `runscript-config-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showFileStatus('success', 'Configuration exported successfully');
}

function importConfiguration() {
  document.getElementById('fileInput').click();
}

async function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const config = JSON.parse(text);
    
    const result = await chrome.storage.local.get('scripts');
    let scripts = result.scripts || {};
    
    // Merge scripts: overwrite existing keys, add new keys
    if (config.scripts && typeof config.scripts === 'object') {
      scripts = { ...scripts, ...config.scripts };
    }
    
    await chrome.storage.local.set({ scripts });
    
    // Merge settings
    if (config.webConfigUrl) {
      await chrome.storage.sync.set({ webConfigUrl: config.webConfigUrl });
      document.getElementById('webConfigUrl').value = config.webConfigUrl;
    }
    if (config.embedBaseUrl) {
      await chrome.storage.sync.set({ embedBaseUrl: config.embedBaseUrl });
      document.getElementById('embedBaseUrl').value = config.embedBaseUrl;
    }
    
    await loadScriptsList();
    
    showFileStatus('success', 'Configuration imported successfully');
  } catch (error) {
    showFileStatus('error', `Failed to import: ${error.message}`);
  }

  // Reset file input
  document.getElementById('fileInput').value = '';
}

async function loadWebConfigUrl() {
  const syncResult = await chrome.storage.sync.get(['webConfigUrl', 'embedBaseUrl']);
  document.getElementById('webConfigUrl').value = syncResult.webConfigUrl || '';
  document.getElementById('embedBaseUrl').value = syncResult.embedBaseUrl || 'https://www.google.com';
}

async function loadFromWeb() {
  const url = document.getElementById('webConfigUrl').value.trim();
  
  if (!url) {
    showWebStatus('error', 'Web configuration URL is not set');
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const config = await response.json();
    
    const result = await chrome.storage.local.get('scripts');
    let scripts = result.scripts || {};
    
    // Merge scripts: overwrite existing keys, add new keys
    if (config.scripts && typeof config.scripts === 'object') {
      scripts = { ...scripts, ...config.scripts };
    }
    
    await chrome.storage.local.set({ scripts });
    
    // Merge settings
    if (config.webConfigUrl) {
      await chrome.storage.sync.set({ webConfigUrl: config.webConfigUrl });
      document.getElementById('webConfigUrl').value = config.webConfigUrl;
    }
    if (config.embedBaseUrl) {
      await chrome.storage.sync.set({ embedBaseUrl: config.embedBaseUrl });
      document.getElementById('embedBaseUrl').value = config.embedBaseUrl;
    }
    
    await loadScriptsList();
    
    showWebStatus('success', 'Configuration loaded from web successfully');
  } catch (error) {
    showWebStatus('error', `Failed to load from web: ${error.message}`);
  }
}

async function generateEmbedUrl() {
  const syncResult = await chrome.storage.sync.get(['webConfigUrl', 'embedBaseUrl']);
  const localResult = await chrome.storage.local.get('scripts');
  const scripts = localResult.scripts || {};
  
  const config = {
    version: '1.0.0',
    exported: new Date().toISOString(),
    webConfigUrl: syncResult.webConfigUrl || '',
    embedBaseUrl: syncResult.embedBaseUrl || '',
    scripts: scripts
  };

  try {
    // Encode configuration as base64 to avoid URL length issues
    const configStr = JSON.stringify(config);
    const encoded = btoa(configStr);
    
    const embedBaseUrl = document.getElementById('embedBaseUrl').value.trim();
    if (!embedBaseUrl) {
      showEmbedStatus('error', 'Base URL is not set');
      return;
    }

    const fullUrl = embedBaseUrl + encodeURIComponent(encoded);
    document.getElementById('embedFullUrl').value = fullUrl;
    
    showEmbedStatus('success', 'Embed URL generated successfully');
  } catch (error) {
    showEmbedStatus('error', `Failed to generate embed URL: ${error.message}`);
  }
}

function copyEmbedUrl() {
  const url = document.getElementById('embedFullUrl').value;
  
  if (!url) {
    showEmbedStatus('error', 'No embed URL to copy');
    return;
  }

  navigator.clipboard.writeText(url).then(() => {
    showEmbedStatus('success', 'URL copied to clipboard');
  }).catch(() => {
    showEmbedStatus('error', 'Failed to copy URL');
  });
}

function showStatus(type, message) {
  const statusEl = document.getElementById('statusMessage');
  if (!statusEl) return;
  
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  
  setTimeout(() => {
    statusEl.className = 'status-message';
  }, 3000);
}

function showFileStatus(type, message) {
  const statusEl = document.getElementById('fileStatusMessage');
  if (!statusEl) return;
  
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  
  setTimeout(() => {
    statusEl.className = 'status-message';
  }, 3000);
}

function showWebStatus(type, message) {
  const statusEl = document.getElementById('webStatusMessage');
  if (!statusEl) return;
  
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  
  setTimeout(() => {
    statusEl.className = 'status-message';
  }, 3000);
}

function showEmbedStatus(type, message) {
  const statusEl = document.getElementById('embedStatusMessage');
  if (!statusEl) return;
  
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  
  setTimeout(() => {
    statusEl.className = 'status-message';
  }, 3000);
}
