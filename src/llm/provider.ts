/**
 * ═══════════════════════════════════════════════════════════════
 * Unified LLM Provider Factory - Cod3x Code v4.0
 * Developed by CodexHaven
 * 
 * Provides unified access to all LLM providers with automatic
 * fallback chain. Supports opencode-proxy, Anthropic, OpenAI,
 * OpenRouter, and custom OpenAI-compatible endpoints.
 * ═══════════════════════════════════════════════════════════════
 */

import {
  LLMProvider,
  LLMProviderType,
  ChatMessage,
  LLMOptions,
  Logger,
  Config,
} from '@codex-types/index';
import { OpenCodeProxyProvider } from './opencode-proxy';
import { AnthropicProvider } from './anthropic-provider';
import { OpenAIProvider } from './openai-provider';
import { OpenRouterProvider } from './openrouter-provider';
import { CustomProvider } from './custom-provider';

export class LLMProviderFactory {
  private providers: Map<LLMProviderType, LLMProvider> = new Map();
  private logger: Logger;
  private config: Config;
  private fallbackChain: LLMProviderType[] = [];

  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.initializeProviders();
  }

  /**
   * Initialize all available providers
   */
  private initializeProviders(): void {
    // Primary: OpenCode Free Proxy (default)
    this.providers.set(
      'opencode-proxy',
      new OpenCodeProxyProvider(
        this.config.ai.opencodeProxyURL,
        this.config.ai.customApiKey,
        this.logger
      )
    );

    // Anthropic (direct API)
    this.providers.set(
      'anthropic',
      new AnthropicProvider(
        process.env.ANTHROPIC_API_KEY,
        undefined,
        this.logger
      )
    );

    // OpenAI (direct API)
    this.providers.set(
      'openai',
      new OpenAIProvider(
        process.env.OPENAI_API_KEY,
        undefined,
        this.logger
      )
    );

    // OpenRouter (access to 200+ models)
    this.providers.set(
      'openrouter',
      new OpenRouterProvider(
        process.env.OPENROUTER_API_KEY,
        undefined,
        this.logger
      )
    );

    // Custom/OpenAI-compatible endpoint
    this.providers.set(
      'custom',
      new CustomProvider(
        this.config.ai.customBaseURL,
        this.config.ai.customApiKey,
        this.logger
      )
    );

    // Build fallback chain: primary -> fallback -> openrouter -> custom -> opencode-proxy
    this.fallbackChain = [
      this.config.ai.provider,
      this.config.ai.fallbackProvider || 'openrouter',
      'opencode-proxy',
      'custom',
    ].filter((v, i, a) => a.indexOf(v) === i) as LLMProviderType[];
  }

  /**
   * Get the primary provider
   */
  getPrimary(): LLMProvider {
    return this.providers.get(this.config.ai.provider) || this.providers.get('opencode-proxy')!;
  }

  /**
   * Get a specific provider by type
   */
  get(type: LLMProviderType): LLMProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * Get all available providers
   */
  getAll(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Check which providers are available
   */
  async checkAvailability(): Promise<{ type: LLMProviderType; available: boolean }[]> {
    const results: { type: LLMProviderType; available: boolean }[] = [];
    
    for (const [type, provider] of this.providers) {
      try {
        const available = await provider.isAvailable();
        results.push({ type, available });
        this.logger.debug(`Provider ${type}: ${available ? 'available' : 'unavailable'}`);
      } catch {
        results.push({ type, available: false });
      }
    }
    
    return results;
  }

  /**
   * Send a chat message with automatic fallback
   */
  async chat(messages: ChatMessage[], options?: LLMOptions): Promise<string> {
    const opts = { ...options, model: options?.model || this.config.ai.model };
    const errors: string[] = [];
    
    for (const providerType of this.fallbackChain) {
      const provider = this.providers.get(providerType);
      if (!provider) continue;

      try {
        this.logger.debug(`Trying provider: ${providerType}`);
        const result = await provider.chat(messages, opts);
        this.logger.info(`Provider ${providerType} succeeded`);
        return result;
      } catch (error) {
        const errMsg = (error as Error).message;
        this.logger.warn(`Provider ${providerType} failed`, { error: errMsg });
        errors.push(`${providerType}: ${errMsg}`);
        continue;
      }
    }

    throw new Error(`All LLM providers failed:\n${errors.join('\n')}\n\nPlease check:\n1. OpenCode proxy is running: npm install -g opencode-free-proxy
2. Or set API keys in .env file (ANTHROPIC_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY)`);
  }

  /**
   * Stream a response with automatic fallback
   */
  async stream(
    messages: ChatMessage[],
    onToken: (token: string) => void,
    options?: LLMOptions
  ): Promise<string> {
    const opts = { ...options, model: options?.model || this.config.ai.model };
    const errors: string[] = [];

    for (const providerType of this.fallbackChain) {
      const provider = this.providers.get(providerType);
      if (!provider) continue;

      try {
        this.logger.debug(`Trying streaming provider: ${providerType}`);
        const result = await provider.stream(messages, onToken, opts);
        return result;
      } catch (error) {
        const errMsg = (error as Error).message;
        this.logger.warn(`Provider ${providerType} streaming failed`, { error: errMsg });
        errors.push(`${providerType}: ${errMsg}`);
        continue;
      }
    }

    throw new Error(`All LLM streaming providers failed:\n${errors.join('\n')}`);
  }

  /**
   * Count tokens using the primary provider
   */
  countTokens(text: string): number {
    return this.getPrimary().countTokens(text);
  }

  /**
   * Create a system prompt for Cod3x
   */
  static createSystemPrompt(context?: { platform?: string; tools?: string[]; agents?: string[] }): string {
    return `You are Cod3x, an expert AI coding assistant developed by CodexHaven (https://github.com/codexhaven/cod3x-code).

Your capabilities include:
- Writing, reviewing, debugging, and optimizing code
- Running shell commands and managing files
- Using Git for version control
- Searching and analyzing codebases
- Generating tests and documentation
- Browsing the web for research
- Running multi-agent swarms for complex tasks
- Debugging with execution trail tracking

${context?.platform ? `Current platform: ${context.platform}` : ''}
${context?.tools ? `Available tools: ${context.tools.join(', ')}` : ''}
${context?.agents ? `Available agents: ${context.agents.join(', ')}` : ''}

When using tools:
- Always validate parameters before calling tools
- Provide complete, working code solutions
- Consider edge cases and error handling
- Use modern language features and patterns
- Follow the project's existing style and conventions

When uncertain, ask clarifying questions rather than making assumptions.
Always prioritize security and best practices.`;
  }
}

export default LLMProviderFactory;
