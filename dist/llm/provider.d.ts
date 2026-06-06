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
import { LLMProvider, LLMProviderType, ChatMessage, LLMOptions, Logger, Config } from '@codex-types/index';
export declare class LLMProviderFactory {
    private providers;
    private logger;
    private config;
    private fallbackChain;
    constructor(config: Config, logger: Logger);
    /**
     * Initialize all available providers
     */
    private initializeProviders;
    /**
     * Get the primary provider
     */
    getPrimary(): LLMProvider;
    /**
     * Get a specific provider by type
     */
    get(type: LLMProviderType): LLMProvider | undefined;
    /**
     * Get all available providers
     */
    getAll(): LLMProvider[];
    /**
     * Check which providers are available
     */
    checkAvailability(): Promise<{
        type: LLMProviderType;
        available: boolean;
    }[]>;
    /**
     * Send a chat message with automatic fallback
     */
    chat(messages: ChatMessage[], options?: LLMOptions): Promise<string>;
    /**
     * Stream a response with automatic fallback
     */
    stream(messages: ChatMessage[], onToken: (token: string) => void, options?: LLMOptions): Promise<string>;
    /**
     * Count tokens using the primary provider
     */
    countTokens(text: string): number;
    /**
     * Create a system prompt for Cod3x
     */
    static createSystemPrompt(context?: {
        platform?: string;
        tools?: string[];
        agents?: string[];
    }): string;
}
export default LLMProviderFactory;
//# sourceMappingURL=provider.d.ts.map