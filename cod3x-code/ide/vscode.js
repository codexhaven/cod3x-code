import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export class VSCodeIntegration {
  constructor() {
    this.extensions = new Map();
    this.suggestions = [];
    this.vscodePath = this.findVSCodePath();
  }
  
  findVSCodePath() {
    const platform = os.platform();
    
    if (platform === 'darwin') {
      return '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code';
    } else if (platform === 'win32') {
      return 'code.cmd';
    } else {
      return 'code';
    }
  }
  
  async isAvailable() {
    try {
      await execAsync(`${this.vscodePath} --version`);
      return true;
    } catch {
      return false;
    }
  }
  
  async openFile(filePath, line = null, column = null) {
    try {
      const absolutePath = path.resolve(filePath);
      let command = `${this.vscodePath} "${absolutePath}"`;
      
      if (line) {
        command += ` -g "${absolutePath}:${line}${column ? `:${column}` : ''}"`;
      }
      
      await execAsync(command);
      return { success: true, message: `Opened ${filePath} in VS Code` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async openFolder(folderPath) {
    try {
      const absolutePath = path.resolve(folderPath);
      await execAsync(`${this.vscodePath} "${absolutePath}"`);
      return { success: true, message: `Opened folder in VS Code` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getOpenFiles() {
    try {
      // This requires VSCode extension support
      // For now, return placeholder
      return { success: true, files: [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getCurrentFile() {
    try {
      // This requires VSCode extension support
      return { success: true, file: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async provideInlineSuggestion(filePath, context, suggestion, line = null) {
    // This would integrate with VSCode's inline suggestion API
    // For now, save to suggestions file
    const suggestionEntry = {
      file: filePath,
      line: line,
      context: context,
      suggestion: suggestion,
      timestamp: Date.now()
    };
    
    this.suggestions.push(suggestionEntry);
    
    // Save to file for extension to read
    const suggestionsFile = path.join(os.tmpdir(), 'cod3x-suggestions.json');
    await fs.writeFile(suggestionsFile, JSON.stringify(this.suggestions.slice(-10)));
    
    return { success: true, suggestionId: suggestionEntry.timestamp };
  }
  
  async installExtension(extensionId) {
    try {
      await execAsync(`${this.vscodePath} --install-extension ${extensionId}`);
      this.extensions.set(extensionId, { installed: true, installedAt: Date.now() });
      return { success: true, message: `Installed extension: ${extensionId}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async uninstallExtension(extensionId) {
    try {
      await execAsync(`${this.vscodePath} --uninstall-extension ${extensionId}`);
      this.extensions.delete(extensionId);
      return { success: true, message: `Uninstalled extension: ${extensionId}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async listExtensions() {
    try {
      const { stdout } = await execAsync(`${this.vscodePath} --list-extensions`);
      const extensions = stdout.split('\n').filter(Boolean);
      return { success: true, extensions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getExtensionInfo(extensionId) {
    try {
      const { stdout } = await execAsync(`${this.vscodePath} --list-extensions --show-versions | grep ${extensionId}`);
      const [id, version] = stdout.trim().split('@');
      return { success: true, id, version };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async setConfiguration(section, value) {
    // This would modify VSCode settings.json
    const settingsPath = path.join(os.homedir(), '.config/Code/User/settings.json');
    
    try {
      let settings = {};
      try {
        const content = await fs.readFile(settingsPath, 'utf-8');
        settings = JSON.parse(content);
      } catch (error) {}
      
      settings[section] = value;
      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
      
      return { success: true, message: `Updated ${section}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async createLaunchConfiguration(config) {
    const launchPath = path.join(process.cwd(), '.vscode/launch.json');
    await fs.mkdir(path.dirname(launchPath), { recursive: true });
    
    let launchConfig = { version: '0.2.0', configurations: [] };
    try {
      const existing = await fs.readFile(launchPath, 'utf-8');
      launchConfig = JSON.parse(existing);
    } catch (error) {}
    
    launchConfig.configurations.push(config);
    await fs.writeFile(launchPath, JSON.stringify(launchConfig, null, 2));
    
    return { success: true, message: 'Launch configuration created' };
  }
  
  async createTasksConfiguration(tasks) {
    const tasksPath = path.join(process.cwd(), '.vscode/tasks.json');
    await fs.mkdir(path.dirname(tasksPath), { recursive: true });
    
    const tasksConfig = { version: '2.0.0', tasks };
    await fs.writeFile(tasksPath, JSON.stringify(tasksConfig, null, 2));
    
    return { success: true, message: 'Tasks configuration created' };
  }
  
  async installRecommendedExtensions() {
    const recommended = [
      'dbaeumer.vscode-eslint',
      'esbenp.prettier-vscode',
      'github.copilot',
      'ms-python.python',
      'ms-vscode.vscode-typescript-next'
    ];
    
    const results = [];
    for (const ext of recommended) {
      const result = await this.installExtension(ext);
      results.push(result);
    }
    
    return { success: true, installed: results.filter(r => r.success).length };
  }
}

export default VSCodeIntegration;
