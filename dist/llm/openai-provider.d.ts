/**
 * ═══════════════════════════════════════════════════════════════
 * OpenAI Provider - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Direct OpenAI API integration
 * ═══════════════════════════════════════════════════════════════
 */
import { LLMProvider, ChatMessage, LLMOptions, Logger } from '@codex-types/index';
export declare class OpenAIProvider implements LLMProvider {
    id: "openai";
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
export default OpenAIProvider;
//# sourceMappingURL=openai-provider.d.ts.map