import { Logger as ILogger, LoggingConfig } from '@codex-types/index';
export declare class Logger implements ILogger {
    private config;
    private initialized;
    constructor(config: LoggingConfig);
    initialize(): Promise<void>;
    private log;
    debug(message: string, data?: unknown): void;
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
    fatal(message: string, data?: unknown): void;
    logRequest(method: string, url: string, duration: number, status: number): void;
    logToolCall(tool: string, params: unknown, duration: number, success: boolean): void;
    logAIResponse(prompt: string, response: string, tokens: number): void;
    logAgentCall(agent: string, task: string, duration: number, success: boolean): void;
    logSwarmEvent(swarm: string, event: string, data?: unknown): void;
}
export default Logger;
//# sourceMappingURL=logger.d.ts.map