import fs from 'fs/promises';
import path from 'path';
import { Logger as ILogger, LoggingConfig } from '@codex-types/index';

export class Logger implements ILogger {
  private config: LoggingConfig;
  private initialized: boolean = false;

  constructor(config: LoggingConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    const logDir = path.dirname(this.config.file);
    await fs.mkdir(logDir, { recursive: true });
    this.initialized = true;
  }

  private async log(level: string, message: string, data?: unknown): Promise<void> {
    const entry = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}${data ? ' ' + JSON.stringify(data).slice(0, 500) : ''}`;
    if (this.config.console) console.log(entry);
    if (this.initialized) {
      await fs.appendFile(this.config.file, entry + '\n');
    }
  }

  debug(message: string, data?: unknown): void { this.log('debug', message, data); }
  info(message: string, data?: unknown): void { this.log('info', message, data); }
  warn(message: string, data?: unknown): void { this.log('warn', message, data); }
  error(message: string, data?: unknown): void { this.log('error', message, data); }
  fatal(message: string, data?: unknown): void { this.log('fatal', message, data); }
  logRequest(method: string, url: string, duration: number, status: number): void { this.log('info', `${method} ${url}`, { duration, status }); }
  logToolCall(tool: string, params: unknown, duration: number, success: boolean): void { this.log('debug', `Tool: ${tool}`, { duration, success }); }
  logAIResponse(prompt: string, response: string, tokens: number): void { this.log('info', 'AI Response', { promptLength: prompt.length, responseLength: response.length, tokens }); }
  logAgentCall(agent: string, task: string, duration: number, success: boolean): void { this.log('info', `Agent: ${agent}`, { task: task.slice(0, 100), duration, success }); }
  logSwarmEvent(swarm: string, event: string, data?: unknown): void { this.log('info', `Swarm ${swarm}: ${event}`, data); }
}

export default Logger;
