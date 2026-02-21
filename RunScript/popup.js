// popup.js
document.addEventListener('DOMContentLoaded', async () => {
  const scriptList = document.getElementById('script-list');
  const emptyState = document.getElementById('empty-state');
  const settingsBtn = document.querySelector('.options-btn');

  // Navigate to options page
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Load and display manual scripts
  const result = await chrome.storage.local.get('scripts');
  const scripts = result.scripts || {};

  const manualScripts = Object.entries(scripts)
    .filter(([_, script]) => {
      if (script.disabled) return false;
      return script.executionModeManual;
    })
    .sort(([_, a], [__, b]) => a.name.localeCompare(b.name));

  if (manualScripts.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';

    manualScripts.forEach(([scriptId, script]) => {
      const li = document.createElement('li');
      li.className = 'script-item manual';

      li.innerHTML = `
        <div class="script-name">${escapeHtml(script.name)}</div>
        <div class="script-info">Context: ${script.executionContext || 'MAIN'}</div>
      `;
      li.addEventListener('click', async () => {
        // Get current tab and execute the script
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
              
        try {
          if (script.executionContext === 'Isolated') {
            // Execute in extension's isolated context
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (code) => {eval(code)},
              args: [script.code],
              world: 'ISOLATED'
            });
        
          } else {
            // Execute in MAIN world via script injection in isolated context,
            // which will inject a script tag into the page
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (code) => {eval(code)},
            //   func: (code) => {
            //     const script = document.createElement('script');
            //     script.textContent = code;
            //     script.onload = () => script.remove();
            //     (document.head || document.documentElement).appendChild(script);
            //   },
              args: [script.code],
              world: 'MAIN'
            });
          }

          console.log(`Executed script: ${script.name}`);
        } catch (error) {
          console.error(`Error executing script: ${error.message}`);
        }
      });

      scriptList.appendChild(li);
    });
  }
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
