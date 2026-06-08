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
import { OpenCodeProxyProvider } from './opencode-proxy.js';
import { AnthropicProvider } from './anthropic-provider.js';
import { OpenAIProvider } from './openai-provider.js';
import { OpenRouterProvider } from './openrouter-provider.js';
import { CustomProvider } from './custom-provider.js';
export class LLMProviderFactory {
    providers = new Map();
    logger;
    config;
    fallbackChain = [];
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.initializeProviders();
    }
    /**
     * Initialize all available providers
     */
    initializeProviders() {
        // Primary: OpenCode Free Proxy (default)
        this.providers.set('opencode-proxy', new OpenCodeProxyProvider(this.config.ai.opencodeProxyURL, this.config.ai.customApiKey, this.logger));
        // Anthropic (direct API)
        this.providers.set('anthropic', new AnthropicProvider(process.env.ANTHROPIC_API_KEY, undefined, this.logger));
        // OpenAI (direct API)
        this.providers.set('openai', new OpenAIProvider(process.env.OPENAI_API_KEY, undefined, this.logger));
        // OpenRouter (access to 200+ models)
        this.providers.set('openrouter', new OpenRouterProvider(process.env.OPENROUTER_API_KEY, undefined, this.logger));
        // Custom/OpenAI-compatible endpoint
        this.providers.set('custom', new CustomProvider(this.config.ai.customBaseURL, this.config.ai.customApiKey, this.logger));
        // Build fallback chain: primary -> fallback -> openrouter -> custom -> opencode-proxy
        this.fallbackChain = [
            this.config.ai.provider,
            this.config.ai.fallbackProvider || 'openrouter',
            'opencode-proxy',
            'custom',
        ].filter((v, i, a) => a.indexOf(v) === i);
    }
    /**
     * Get the primary provider
     */
    getPrimary() {
        return this.providers.get(this.config.ai.provider) || this.providers.get('opencode-proxy');
    }
    /**
     * Get a specific provider by type
     */
    get(type) {
        return this.providers.get(type);
    }
    /**
     * Get all available providers
     */
    getAll() {
        return Array.from(this.providers.values());
    }
    /**
     * Check which providers are available
     */
    async checkAvailability() {
        const results = [];
        for (const [type, provider] of this.providers) {
            try {
                const available = await provider.isAvailable();
                results.push({ type, available });
                this.logger.debug(`Provider ${type}: ${available ? 'available' : 'unavailable'}`);
            }
            catch {
                results.push({ type, available: false });
            }
        }
        return results;
    }
    /**
     * Send a chat message with automatic fallback
     */
    async chat(messages, options) {
        const opts = { ...options, model: options?.model || this.config.ai.model };
        const errors = [];
        for (const providerType of this.fallbackChain) {
            const provider = this.providers.get(providerType);
            if (!provider)
                continue;
            try {
                this.logger.debug(`Trying provider: ${providerType}`);
                const result = await provider.chat(messages, opts);
                this.logger.info(`Provider ${providerType} succeeded`);
                return result;
            }
            catch (error) {
                const errMsg = error.message;
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
    async stream(messages, onToken, options) {
        const opts = { ...options, model: options?.model || this.config.ai.model };
        const errors = [];
        for (const providerType of this.fallbackChain) {
            const provider = this.providers.get(providerType);
            if (!provider)
                continue;
            try {
                this.logger.debug(`Trying streaming provider: ${providerType}`);
                const result = await provider.stream(messages, onToken, opts);
                return result;
            }
            catch (error) {
                const errMsg = error.message;
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
    countTokens(text) {
        return this.getPrimary().countTokens(text);
    }
    /**
     * Create a system prompt for Cod3x
     */
    static createSystemPrompt(context) {
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
//# sourceMappingURL=provider.js.map