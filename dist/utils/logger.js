import fs from 'fs/promises';
import path from 'path';
export class Logger {
    config;
    initialized = false;
    constructor(config) {
        this.config = config;
    }
    async initialize() {
        const logDir = path.dirname(this.config.file);
        await fs.mkdir(logDir, { recursive: true });
        this.initialized = true;
    }
    async log(level, message, data) {
        const entry = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}${data ? ' ' + JSON.stringify(data).slice(0, 500) : ''}`;
        if (this.config.console)
            console.log(entry);
        if (this.initialized) {
            await fs.appendFile(this.config.file, entry + '\n');
        }
    }
    debug(message, data) { this.log('debug', message, data); }
    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
    fatal(message, data) { this.log('fatal', message, data); }
    logRequest(method, url, duration, status) { this.log('info', `${method} ${url}`, { duration, status }); }
    logToolCall(tool, params, duration, success) { this.log('debug', `Tool: ${tool}`, { duration, success }); }
    logAIResponse(prompt, response, tokens) { this.log('info', 'AI Response', { promptLength: prompt.length, responseLength: response.length, tokens }); }
    logAgentCall(agent, task, duration, success) { this.log('info', `Agent: ${agent}`, { task: task.slice(0, 100), duration, success }); }
    logSwarmEvent(swarm, event, data) { this.log('info', `Swarm ${swarm}: ${event}`, data); }
}
export default Logger;
//# sourceMappingURL=logger.js.map