import { Config } from '@codex-types/index';
interface NonInteractiveResult {
    success: boolean;
    output: string;
    tokensUsed?: number;
    duration?: number;
    error?: string;
}
export declare class NonInteractiveRunner {
    private config;
    constructor(config: Config);
    execute(prompt: string): Promise<NonInteractiveResult>;
}
export default NonInteractiveRunner;
//# sourceMappingURL=non-interactive.d.ts.map