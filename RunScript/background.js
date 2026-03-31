// background.js

// Background service worker for handling extension lifecycle and events

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    // Automatically load web configuration on update if set
    const result = await chrome.storage.sync.get('webConfigUrl');
    if (result.webConfigUrl) {
      try {
        await loadConfigFromUrl(result.webConfigUrl);
      } catch (error) {
        console.warn(`Failed to load config ${result.webConfigUrl} on update:`, error);
      }
    }
  }
});

// Listen for URL changes to handle embedded configurations
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // If tab is loading, attempt automatic script injection
  if (changeInfo.status === 'loading' && tab.url) {
    try {
      await injectAutomaticScriptsForTab(tabId, tab.url);
    } catch (error) {
      console.error('Automatic injection failed:', error);
    }
  }

  // If navigation completed, check for embedded configuration parameter (q=)
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if URL contains embedded configuration
    const url = new URL(tab.url);
    const base = url.origin + url.pathname;
    const configParam = url.searchParams.get('q');
    const result = await chrome.storage.sync.get('embedBaseUrl');
    const url2 = new URL(result?.embedBaseUrl || "http://dummy");
    const base2 = url2.origin + url2.pathname;
    //console.log("tab navigation completed", base, base2, configParam);
    
    if (configParam && base === base2) {
      try {
        const config = JSON.parse(configParam);
        console.log("decoded from embedded URL", configParam);

        // Load the configuration
        const result = await chrome.storage.local.get('scripts');
        let scripts = result.scripts || {};
        
        if (config.scripts && typeof config.scripts === 'object') {
          scripts = { ...scripts, ...config.scripts };
          await chrome.storage.local.set({ scripts });
        }
        
        // Load settings
        if (config.webConfigUrl) {
          await chrome.storage.sync.set({ webConfigUrl: config.webConfigUrl });
        }
        if (config.embedBaseUrl) {
          await chrome.storage.sync.set({ embedBaseUrl: config.embedBaseUrl });
        }
        
        // Notify user (could be a toast or sync icon)
        console.log('Configuration loaded from embedded URL');
        chrome.notifications.create({ type: "basic", iconUrl: "images/icon-48.png", title: "Run Script", message: "Configuration loaded from embedded URL" });
      } catch (error) {
        console.error('Failed to parse embedded configuration:', error);
      }
    }
  }
});

// Inject automatic scripts that match the given tab URL
async function injectAutomaticScriptsForTab(tabId, tabUrl) {
  const result = await chrome.storage.local.get('scripts');
  const scripts = result.scripts || {};

  const urlStr = tabUrl.toString ? tabUrl.toString() : tabUrl;

  for (const scriptId of Object.keys(scripts)) {
    const script = scripts[scriptId];

    try {
      if (!script) continue;
      if (script.disabled) continue;

      // Only automatic when numeric flag set (true) or legacy executionMode indicates automatic/both
      const isAutomatic = script.executionModeAutomatic;
      if (!isAutomatic) continue;

      // If pattern empty, skip
      if (!script.urlPattern) continue;

      if (!matchUrlPattern(urlStr, script.urlPattern)) continue;

      // Attempt injection using chrome.scripting.executeScript
      const target = { tabId, allFrames: true };

      if (script.executionContext === 'Isolated') {
        // Run in isolated extension world
        await chrome.scripting.executeScript({
          target,
          world: 'ISOLATED',
          func: (code) => { eval(code); },  // this must result in error!!
          args: [script.code]
        });
      } else {
        // Run in the page's MAIN world by injecting a script tag
        await chrome.scripting.executeScript({
          target,
          world: 'MAIN',
          func: (code) => { eval(code); },
        //   func: (code) => {
        //     const s = document.createElement('script');
        //     s.textContent = code;
        //     s.onload = () => s.remove();
        //     (document.head || document.documentElement).appendChild(s);
        //   },
          args: [script.code]
        });
      }
    } catch (error) {
      console.error(`Failed to inject script ${scriptId}:`, error);
    }
  }
}

// Simple URL pattern matching (copied from previous content script)
function matchUrlPattern(url, pattern) {
  if (!pattern) return false;

  let regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  try {
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(url);
  } catch (error) {
    console.error(`Invalid URL pattern: ${pattern}`);
    return false;
  }
}

// Helper function to load configuration from web URL
async function loadConfigFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const config = await response.json();
  
  const result = await chrome.storage.local.get('scripts');
  let scripts = result.scripts || {};
  
  if (config.scripts && typeof config.scripts === 'object') {
    scripts = { ...scripts, ...config.scripts };
    await chrome.storage.local.set({ scripts });
  }
  
  // Load settings
  if (config.webConfigUrl) {
    await chrome.storage.sync.set({ webConfigUrl: config.webConfigUrl });
  }
  if (config.embedBaseUrl) {
    await chrome.storage.sync.set({ embedBaseUrl: config.embedBaseUrl });
  }
}

// Handle messages from content scripts and popup
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'reload-scripts') {
//     // Trigger content script reload if needed
//     sendResponse({ success: true });
//   }
// });
