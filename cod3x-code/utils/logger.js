import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class Logger {
  constructor(options = {}) {
    this.options = {
      level: 'info',
      logDir: 'logs',
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      timestamp: true,
      colors: true,
      ...options
    };
    
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4
    };
    
    this.currentLogFile = null;
    this.stream = null;
    this.initialize();
  }
  
  async initialize() {
    await fs.mkdir(this.options.logDir, { recursive: true });
    
    const date = new Date().toISOString().split('T')[0];
    this.currentLogFile = path.join(this.options.logDir, `cod3x-${date}.log`);
    
    await this.rotateIfNeeded();
  }
  
  async rotateIfNeeded() {
    try {
      const stats = await fs.stat(this.currentLogFile);
      if (stats.size > this.options.maxSize) {
        const timestamp = Date.now();
        const rotatedPath = `${this.currentLogFile}.${timestamp}`;
        await fs.rename(this.currentLogFile, rotatedPath);
        
        // Delete old files
        const files = await fs.readdir(this.options.logDir);
        const logFiles = files.filter(f => f.startsWith('cod3x-')).sort();
        while (logFiles.length > this.options.maxFiles) {
          const oldest = logFiles.shift();
          await fs.unlink(path.join(this.options.logDir, oldest));
        }
      }
    } catch (error) {
      // File doesn't exist yet
    }
  }
  
  format(level, message, data = null) {
    const parts = [];
    
    if (this.options.timestamp) {
      parts.push(new Date().toISOString());
    }
    
    parts.push(`[${level.toUpperCase()}]`);
    parts.push(message);
    
    if (data) {
      parts.push(JSON.stringify(data));
    }
    
    return parts.join(' ');
  }
  
  async write(level, message, data = null) {
    if (this.levels[level] < this.levels[this.options.level]) {
      return;
    }
    
    const formatted = this.format(level, message, data);
    
    // Console output with colors
    if (this.options.colors) {
      const colors = {
        debug: '\x1b[36m',  // Cyan
        info: '\x1b[32m',   // Green
        warn: '\x1b[33m',   // Yellow        error: '\x1b[31m',  // Red
        fatal: '\x1b[35m'   // Magenta
      };
      const reset = '\x1b[0m';
      console.log(`${colors[level] || ''}${formatted}${reset}`);
    } else {
      console.log(formatted);
    }
    
    // File output
    try {
      await this.rotateIfNeeded();
      await fs.appendFile(this.currentLogFile, formatted + '\n');
    } catch (error) {
      // Silent fail for logging
    }
  }
  
  debug(message, data = null) {
    return this.write('debug', message, data);
  }
  
  info(message, data = null) {
    return this.write('info', message, data);
  }
  
  warn(message, data = null) {
    return this.write('warn', message, data);
  }
  
  error(message, data = null) {
    return this.write('error', message, data);
  }
  
  fatal(message, data = null) {
    return this.write('fatal', message, data);
  }
  
  async logRequest(method, url, duration, status) {
    await this.info(`${method} ${url}`, { duration, status });
  }
  
  async logToolCall(toolName, params, duration, success) {
    await this.debug(`Tool: ${toolName}`, { params, duration, success });
  }
  
  async logAIResponse(prompt, response, tokens) {
    await this.info('AI Response', { promptLength: prompt.length, responseLength: response.length, tokens });
  }
  
  async logError(error, context = {}) {
    await this.error(error.message, {
      stack: error.stack,
      ...context
    });
  }
  
  async getLogs(level = null, limit = 100) {
    try {
      const content = await fs.readFile(this.currentLogFile, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());
      
      let logs = lines.map(line => {
        try {
          const timestamp = line.slice(0, 19);
          const levelMatch = line.match(/\[(\w+)\]/);
          const message = line.slice(line.indexOf(']') + 2);
          return { timestamp, level: levelMatch?.[1]?.toLowerCase(), message };
        } catch {
          return null;
        }
      }).filter(l => l);
      
      if (level) {
        logs = logs.filter(l => l.level === level);
      }
      
      return logs.slice(-limit);
    } catch (error) {
      return [];
    }
  }
  
  async clearLogs() {
    try {
      await fs.writeFile(this.currentLogFile, '');
      return true;
    } catch {
      return false;
    }
  }
  
  async getStats() {
    try {
      const stats = await fs.stat(this.currentLogFile);
      const logs = await this.getLogs(null, 1000);
      
      const levelCount = {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        fatal: 0
      };
      
      for (const log of logs) {
        if (levelCount[log.level]) levelCount[log.level]++;
      }
      
      return {
        size: stats.size,
        lines: logs.length,
        levels: levelCount,
        currentFile: this.currentLogFile
      };
    } catch {
      return null;
    }
  }
}

export default Logger;
