import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';

export class PermissionManager {
  constructor(config = {}) {
    this.config = {
      askBeforeBash: true,
      askBeforeWrite: true,
      askBeforeDelete: true,
      askBeforeNetwork: true,
      autoApprovePatterns: [],
      autoDenyPatterns: [],
      ...config
    };
    
    this.permissionsCache = new Map();
    this.sessionApprovals = new Set();
  }
  
  async askPermission(action, details, options = {}) {
    const { timeout = 30000, cache = false } = options;
    
    // Check cache
    const cacheKey = `${action}:${JSON.stringify(details)}`;
    if (cache && this.permissionsCache.has(cacheKey)) {
      return this.permissionsCache.get(cacheKey);
    }
    
    // Auto-approve patterns
    for (const pattern of this.config.autoApprovePatterns) {
      if (pattern.test(JSON.stringify(details))) {
        return true;
      }
    }
    
    // Auto-deny patterns
    for (const pattern of this.config.autoDenyPatterns) {
      if (pattern.test(JSON.stringify(details))) {
        return false;
      }
    }
    
    // Check if already approved this session
    const sessionKey = `${action}:${details.command || details.path}`;
    if (this.sessionApprovals.has(sessionKey)) {
      return true;
    }
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const prompt = this.formatPrompt(action, details);
    
    const answer = await new Promise((resolve) => {
      const timer = setTimeout(() => {
        rl.close();
        resolve('n');
      }, timeout);
      
      rl.question(prompt, (answer) => {
        clearTimeout(timer);
        rl.close();
        resolve(answer.toLowerCase());
      });
    });
    
    const granted = answer === 'y' || answer === 'yes' || answer === 'always';
    
    if (answer === 'always') {
      this.sessionApprovals.add(sessionKey);
    }
    
    if (cache) {
      this.permissionsCache.set(cacheKey, granted);
    }
    
    return granted;
  }
  
  formatPrompt(action, details) {
    const icons = {
      bash: '💻',
      write: '📝',
      delete: '🗑️',
      network: '🌐',
      unknown: '❓'
    };
    
    const icon = icons[action] || icons.unknown;
    
    switch(action) {
      case 'bash':
        return `\n${icon} Allow command: "${details.command}"?\n   Directory: ${details.cwd || process.cwd()}\n   (y/n/always): `;
      case 'write':
        return `\n${icon} Write to file: "${details.path}"?\n   Size: ${details.size || 'unknown'} bytes\n   (y/n/always): `;
      case 'delete':
        return `\n${icon} Delete file: "${details.path}"?\n   This cannot be undone!\n   (y/n/always): `;
      case 'network':
        return `\n${icon} Allow network request to: "${details.url}"?\n   (y/n/always): `;
      default:
        return `\n${icon} Allow ${action}?\n   ${JSON.stringify(details)}\n   (y/n/always): `;
    }
  }
  
  async askBash(command, cwd = process.cwd()) {
    if (!this.config.askBeforeBash) return true;
    
    return this.askPermission('bash', { command, cwd });
  }
  
  async askWrite(path, size = null) {
    if (!this.config.askBeforeWrite) return true;
    
    return this.askPermission('write', { path, size });
  }
  
  async askDelete(path) {
    if (!this.config.askBeforeDelete) return true;
    
    return this.askPermission('delete', { path });
  }
  
  async askNetwork(url) {
    if (!this.config.askBeforeNetwork) return true;
    
    return this.askPermission('network', { url });
  }
  
  addAutoApprove(pattern) {
    this.config.autoApprovePatterns.push(pattern);
  }
  
  addAutoDeny(pattern) {
    this.config.autoDenyPatterns.push(pattern);
  }
  
  clearCache() {
    this.permissionsCache.clear();
    this.sessionApprovals.clear();
  }
  
  async loadRules(rulesPath) {
    try {
      const content = await fs.readFile(rulesPath, 'utf-8');
      const rules = JSON.parse(content);
      
      if (rules.autoApprove) {
        for (const pattern of rules.autoApprove) {
          this.addAutoApprove(new RegExp(pattern));
        }
      }
      
      if (rules.autoDeny) {
        for (const pattern of rules.autoDeny) {
          this.addAutoDeny(new RegExp(pattern));
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  getStats() {
    return {
      cacheSize: this.permissionsCache.size,
      sessionApprovals: this.sessionApprovals.size,
      autoApprovePatterns: this.config.autoApprovePatterns.length,
      autoDenyPatterns: this.config.autoDenyPatterns.length
    };
  }
}

export default PermissionManager;
