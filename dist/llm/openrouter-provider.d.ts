/**
 * ═══════════════════════════════════════════════════════════════
 * OpenRouter Provider - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * OpenRouter API integration - access 200+ models
 * ═══════════════════════════════════════════════════════════════
 */
import { LLMProvider, ChatMessage, LLMOptions, Logger } from '@codex-types/index';
export declare class OpenRouterProvider implements LLMProvider {
    id: "openrouter";
    name: string;
    models: string[];
    private apiKey;
    private baseURL;
    private logger;
    constructor(apiKey?: string, baseURL?: string, logger?: Logger);
    isAvailable(): Promise<boolean>;
    chat(messages: ChatMessage[], options?: LLMOptions): Promise<string>;
    stream(messages: ChatMessage[], onToken: (token: string) => void, options?: LLMOptions): Promise<string>;
    countTokens(text: string): number;
    private makeRequest;
    private makeStreamingRequest;
}
export default OpenRouterProvider;
//# sourceMappingURL=openrouter-provider.d.ts.map