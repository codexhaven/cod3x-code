import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class Sandbox {
  constructor(options = {}) {
    this.options = {
      timeout: 30000,
      maxMemory: 512 * 1024 * 1024, // 512MB
      maxFiles: 100,
      allowedPaths: [process.cwd()],
      blockedEnvVars: ['PATH', 'HOME', 'USER', 'SHELL'],
      ...options
    };
    
    this.tempDir = null;
  }
  
  async createSandbox() {
    // Create temporary directory for sandbox
    this.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cod3x-sandbox-'));
    return this.tempDir;
  }
  
  async cleanup() {
    if (this.tempDir) {
      await fs.rm(this.tempDir, { recursive: true, force: true });
      this.tempDir = null;
    }
  }
  
  async executeInSandbox(command, options = {}) {
    const sandboxDir = this.tempDir || await this.createSandbox();
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        child.kill();
        resolve({ success: false, error: 'Command timeout', output: '' });
      }, options.timeout || this.options.timeout);
      
      const child = spawn(command, {
        cwd: options.cwd || sandboxDir,
        shell: true,
        env: this.sanitizeEnv(),
        detached: true
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
        if (stdout.length > 1024 * 1024) { // 1MB limit
          child.kill();
        }
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        clearTimeout(timeout);
        resolve({
          success: code === 0,
          exitCode: code,
          stdout: stdout.slice(0, 10000),
          stderr: stderr.slice(0, 10000),
          output: stdout || stderr
        });
      });
      
      child.on('error', (error) => {
        clearTimeout(timeout);
        resolve({ success: false, error: error.message, output: '' });
      });
    });
  }
  
  sanitizeEnv() {
    const safeEnv = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (!this.options.blockedEnvVars.includes(key)) {
        safeEnv[key] = value;
      }
    }
    return safeEnv;
  }
  
  isPathAllowed(filePath) {
    const resolved = path.resolve(filePath);
    for (const allowed of this.options.allowedPaths) {
      if (resolved.startsWith(path.resolve(allowed))) {
        return true;
      }
    }
    return false;
  }
  
  sanitizePath(filePath) {
    // Remove path traversal attempts
    let sanitized = filePath.replace(/\.\./g, '');
    sanitized = sanitized.replace(/\/\//g, '/');
    
    // Ensure within allowed paths
    if (!this.isPathAllowed(sanitized)) {
      throw new Error(`Path not allowed: ${filePath}`);
    }
    
    return sanitized;
  }
  
  async copyToSandbox(sourcePath, destPath = null) {
    if (!this.tempDir) await this.createSandbox();
    
    const dest = destPath ? path.join(this.tempDir, destPath) : path.join(this.tempDir, path.basename(sourcePath));
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(sourcePath, dest);
    
    return dest;
  }
  
  async readFromSandbox(filePath) {
    if (!this.tempDir) return null;
    
    const fullPath = path.join(this.tempDir, filePath);
    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch {
      return null;
    }
  }
  
  isCommandSafe(command) {
    const dangerousPatterns = [
      /rm\s+(-rf?|--recursive)\s+[\/~]/i,
      /sudo\s+/i,
      /chmod\s+777\s+/i,
      /dd\s+if=/i,
      />\s*\/dev\/sd/i,
      /mkfs/i,
      /:\(\)\s*\{\s*:\|:&\s*\};:/,
      /curl.*\|\s*bash/i,
      /wget.*\|\s*bash/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        return false;
      }
    }
    
    return true;
  }
  
  async measureResourceUsage(fn) {
    const startCPU = process.cpuUsage();
    const startMem = process.memoryUsage().heapUsed;
    const startTime = Date.now();
    
    const result = await fn();
    
    const endCPU = process.cpuUsage(startCPU);
    const endMem = process.memoryUsage().heapUsed;
    const endTime = Date.now();
    
    return {
      result,
      metrics: {
        cpuTime: endCPU.user + endCPU.system,
        memoryDelta: endMem - startMem,
        duration: endTime - startTime
      }
    };
  }
  
  async withSandbox(fn) {
    await this.createSandbox();
    try {
      const result = await fn(this);
      return result;
    } finally {
      await this.cleanup();
    }
  }
}

export default Sandbox;
