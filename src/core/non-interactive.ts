import { Config } from '@codex-types/index';
import { LLMProviderFactory } from '@llm/provider';
import { Logger } from '@utils/logger';

interface NonInteractiveResult {
  success: boolean;
  output: string;
  tokensUsed?: number;
  duration?: number;
  error?: string;
}

export class NonInteractiveRunner {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async execute(prompt: string): Promise<NonInteractiveResult> {
    const startTime = Date.now();
    
    try {
      const logger = new Logger({ ...this.config.logging, console: false });
      await logger.initialize();
      
      const llmFactory = new LLMProviderFactory(this.config, logger);
      
      const messages = [
        { role: 'system' as const, content: `You are Cod3x, an AI coding assistant by CodexHaven.` },
        { role: 'user' as const, content: prompt },
      ];
      
      const response = await llmFactory.chat(messages);
      
      return {
        success: true,
        output: response,
        tokensUsed: llmFactory.countTokens(prompt + response),
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
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
