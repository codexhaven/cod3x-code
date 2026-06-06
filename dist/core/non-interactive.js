import { LLMProviderFactory } from '../llm/provider.js';
import { Logger } from '../utils/logger.js';
export class NonInteractiveRunner {
    config;
    constructor(config) {
        this.config = config;
    }
    async execute(prompt) {
        const startTime = Date.now();
        try {
            const logger = new Logger({ ...this.config.logging, console: false });
            await logger.initialize();
            const llmFactory = new LLMProviderFactory(this.config, logger);
            const messages = [
                { role: 'system', content: `You are Cod3x, an AI coding assistant by CodexHaven.` },
                { role: 'user', content: prompt },
            ];
            const response = await llmFactory.chat(messages);
            return {
                success: true,
                output: response,
                tokensUsed: llmFactory.countTokens(prompt + response),
                duration: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                success: false,
                output: '',
                error: error.message,
                duration: Date.now() - startTime,
            };
        }
    }
}
export default NonInteractiveRunner;
//# sourceMappingURL=non-interactive.js.map