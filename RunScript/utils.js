// utils.js - Utility functions for RunScript

/**
 * URL pattern matching utility
 * Converts wildcard patterns to regex and performs matching
 */
export class UrlPatternMatcher {
  /**
   * Check if URL matches pattern
   * Supports wildcards: * (any sequence), ? (single char)
   * @param {string} url - URL to check
   * @param {string} pattern - Pattern with wildcards
   * @returns {boolean} - True if URL matches pattern
   */
  static matches(url, pattern) {
    if (!pattern) return false;
    
    try {
      // Escape regex special chars except * and ?
      let regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      
      const regex = new RegExp(`^${regexPattern}$`, 'i');
      return regex.test(url);
    } catch (error) {
      console.error(`Invalid URL pattern: ${pattern}`, error);
      return false;
    }
  }
}

/**
 * Configuration management utilities
 */
export class ConfigManager {
  static CONFIG_VERSION = '1.0.0';

  /**
   * Create new blank configuration
   */
  static createBlankConfig() {
    return {
      version: this.CONFIG_VERSION,
      exported: new Date().toISOString(),
      scripts: {}
    };
  }

  /**
   * Validate configuration structure
   */
  static isValidConfig(config) {
    return (
      config &&
      typeof config === 'object' &&
      config.scripts &&
      typeof config.scripts === 'object'
    );
  }

  /**
   * Merge two configurations (newer overwrites older)
   */
  static mergeConfigs(existing, incoming) {
    if (!this.isValidConfig(incoming)) {
      throw new Error('Invalid configuration format');
    }

    return {
      ...existing,
      scripts: { ...existing.scripts, ...incoming.scripts }
    };
  }

  /**
   * Export configuration as JSON string
   */
  static export(scripts) {
    const config = {
      version: this.CONFIG_VERSION,
      exported: new Date().toISOString(),
      scripts: scripts
    };
    return JSON.stringify(config, null, 2);
  }

  /**
   * Encode configuration for URL embedding
   */
  static encodeForUrl(config) {
    const json = JSON.stringify(config);
    return btoa(json);
  }

  /**
   * Decode configuration from URL
   */
  static decodeFromUrl(encoded) {
    try {
      const json = atob(encoded);
      return JSON.parse(json);
    } catch (error) {
      throw new Error('Failed to decode configuration from URL');
    }
  }
}

/**
 * Script execution utilities
 */
export class ScriptExecutor {
  /**
   * Execute code in main world via script injection
   */
  static executeInMainWorld(code) {
    const script = document.createElement('script');
    script.textContent = code;
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  }

  /**
   * Validate JavaScript code syntax
   */
  static validateCode(code) {
    try {
      new Function(code);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

/**
 * Storage utilities for local and sync storage
 */
export class StorageUtil {
  /**
   * Get all scripts from local storage
   */
  static async getScripts() {
    const result = await chrome.storage.local.get('scripts');
    return result.scripts || {};
  }

  /**
   * Save scripts to local storage
   */
  static async saveScripts(scripts) {
    await chrome.storage.local.set({ scripts });
  }

  /**
   * Get a single script
   */
  static async getScript(scriptId) {
    const scripts = await this.getScripts();
    return scripts[scriptId] || null;
  }

  /**
   * Add or update a script
   */
  static async saveScript(scriptId, scriptData) {
    const scripts = await this.getScripts();
    scripts[scriptId] = {
      ...scripts[scriptId],
      ...scriptData,
      updatedAt: new Date().toISOString()
    };
    await this.saveScripts(scripts);
  }

  /**
   * Delete a script
   */
  static async deleteScript(scriptId) {
    const scripts = await this.getScripts();
    delete scripts[scriptId];
    await this.saveScripts(scripts);
  }

  /**
   * Get sync storage value
   */
  static async getSyncValue(key) {
    const result = await chrome.storage.sync.get(key);
    return result[key];
  }

  /**
   * Set sync storage value
   */
  static async setSyncValue(key, value) {
    await chrome.storage.sync.set({ [key]: value });
  }
}
