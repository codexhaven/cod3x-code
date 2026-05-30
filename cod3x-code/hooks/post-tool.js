import fs from 'fs/promises';
import path from 'path';

export class PostToolHook {
  constructor(config = {}) {
    this.config = {
      logResults: true,
      notifyOnError: true,
      measurePerformance: true,
      trackUsage: true,
      logFile: 'logs/tool-usage.json',
      notifyOnSlow: 5000,
      ...config
    };
    
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageDuration: 0,
      toolStats: new Map()
    };
  }
  
  async afterExecute(toolName, params, result, startTime) {
    const duration = Date.now() - startTime;
    const success = result.success === true;
    
    // Update stats
    this.updateStats(toolName, success, duration);
    
    const logEntry = {
      tool: toolName,
      timestamp: new Date().toISOString(),
      duration: duration,
      success: success,
      params: this.sanitizeParams(params),
      resultPreview: success ? result.output?.slice(0, 200) : result.error
    };
    
    // Logging
    if (this.config.logResults) {
      await this.logExecution(logEntry);
    }
    
    // Performance monitoring
    if (this.config.measurePerformance && duration > this.config.notifyOnSlow) {
      console.warn(`⚠️ Slow tool execution: ${toolName} took ${duration}ms`);
      this.emit('slow-tool', { tool: toolName, duration, params });
    }
    
    // Error notification
    if (this.config.notifyOnError && !success) {
      await this.notifyError(toolName, result.error, params);
    }
    
    // Track usage
    if (this.config.trackUsage) {
      await this.trackUsage(toolName, duration, success);
    }
    
    // Modify result if needed (e.g., add metadata)
    const enhancedResult = {
      ...result,
      _meta: {
        tool: toolName,
        duration,
        timestamp: Date.now(),
        hook: 'post-tool'
      }
    };
    
    return enhancedResult;
  }
  
  updateStats(toolName, success, duration) {
    this.stats.totalCalls++;
    if (success) {
      this.stats.successfulCalls++;
    } else {
      this.stats.failedCalls++;
    }
    
    // Update average duration
    this.stats.averageDuration = 
      (this.stats.averageDuration * (this.stats.totalCalls - 1) + duration) / this.stats.totalCalls;
    
    // Tool-specific stats
    if (!this.stats.toolStats.has(toolName)) {
      this.stats.toolStats.set(toolName, { calls: 0, duration: 0, failures: 0 });
    }
    const toolStat = this.stats.toolStats.get(toolName);
    toolStat.calls++;
    toolStat.duration += duration;
    if (!success) toolStat.failures++;
  }
  
  async logExecution(logEntry) {
    try {
      await fs.mkdir(path.dirname(this.config.logFile), { recursive: true });
      
      let logs = [];
      try {
        const existing = await fs.readFile(this.config.logFile, 'utf-8');
        logs = JSON.parse(existing);
      } catch (error) {
        // No existing log file
      }
      
      logs.push(logEntry);
      
      // Keep last 1000 entries
      if (logs.length > 1000) {
        logs = logs.slice(-1000);
      }
      
      await fs.writeFile(this.config.logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      // Silent fail for logging
    }
  }
  
  async notifyError(toolName, error, params) {
    // Could send to system notification, webhook, etc.
    console.error(`\n🔴 Tool Error: ${toolName}\n   Error: ${error}\n   Params: ${JSON.stringify(params).slice(0, 200)}\n`);
    
    // Could also write to error log
    const errorLog = {
      tool: toolName,
      error: error,
      params: this.sanitizeParams(params),
      timestamp: Date.now()
    };
    
    try {
      await fs.mkdir('logs', { recursive: true });
      await fs.appendFile('logs/errors.log', JSON.stringify(errorLog) + '\n');
    } catch (err) {}
  }
  
  async trackUsage(toolName, duration, success) {
    // Track for analytics/quotas
    const usageFile = 'logs/usage.json';
    let usage = {};
    
    try {
      const existing = await fs.readFile(usageFile, 'utf-8');
      usage = JSON.parse(existing);
    } catch (error) {}
    
    const today = new Date().toISOString().split('T')[0];
    if (!usage[today]) usage[today] = {};
    if (!usage[today][toolName]) usage[today][toolName] = { calls: 0, duration: 0, failures: 0 };
    
    usage[today][toolName].calls++;
    usage[today][toolName].duration += duration;
    if (!success) usage[today][toolName].failures++;
    
    await fs.writeFile(usageFile, JSON.stringify(usage, null, 2));
  }
  
  sanitizeParams(params) {
    const sanitized = { ...params };
    // Remove sensitive data
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
    for (const key of sensitiveKeys) {
      if (sanitized[key]) {
        sanitized[key] = '***REDACTED***';
      }
    }
    // Truncate long content
    if (sanitized.content && sanitized.content.length > 500) {
      sanitized.content = sanitized.content.slice(0, 500) + '... (truncated)';
    }
    return sanitized;
  }
  
  getStats() {
    const toolStatsArray = Array.from(this.stats.toolStats.entries()).map(([name, stats]) => ({
      name,
      calls: stats.calls,
      avgDuration: Math.round(stats.duration / stats.calls),
      successRate: Math.round(((stats.calls - stats.failures) / stats.calls) * 100),
      failures: stats.failures
    }));
    
    return {
      totalCalls: this.stats.totalCalls,
      successRate: this.stats.totalCalls > 0 
        ? Math.round((this.stats.successfulCalls / this.stats.totalCalls) * 100) 
        : 0,
      averageDuration: Math.round(this.stats.averageDuration),
      toolStats: toolStatsArray
    };
  }
  
  emit(event, data) {
    if (this.listeners && this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
  
  on(event, callback) {
    if (!this.listeners) this.listeners = {};
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
}

export default PostToolHook;
