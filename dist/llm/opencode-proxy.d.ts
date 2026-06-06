/**
 * ═══════════════════════════════════════════════════════════════
 * OpenCode Free Proxy Provider - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Default provider using the opencode-free-proxy ecosystem
 * Provides free access to Claude, GPT, Gemini, and more
 * ═══════════════════════════════════════════════════════════════
 */
import { LLMProvider, ChatMessage, LLMOptions, Logger } from '@codex-types/index';
export declare class OpenCodeProxyProvider implements LLMProvider {
    id: "opencode-proxy";
    name: string;
    models: string[];
    private proxyURL;
    private apiKey;
    private logger;
    constructor(proxyURL?: string, apiKey?: string, logger?: Logger);
    /**
     * Check if the proxy is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Send a chat completion request
     */
    chat(messages: ChatMessage[], options?: LLMOptions): Promise<string>;
    /**
     * Stream a chat completion response
     */
    stream(messages: ChatMessage[], onToken: (token: string) => void, options?: LLMOptions): Promise<string>;
    /**
     * Count tokens (approximation)
     */
    countTokens(text: string): number;
    /**
     * Make a non-streaming HTTP request
     */
    private makeRequest;
    /**
     * Make a streaming HTTP request
     */
    private makeStreamingRequest;
}
export default OpenCodeProxyProvider;
//# sourceMappingURL=opencode-proxy.d.ts.map