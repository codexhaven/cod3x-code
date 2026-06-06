/**
 * ═══════════════════════════════════════════════════════════════
 * Custom/OpenAI-Compatible Provider - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Generic provider for any OpenAI-compatible API endpoint
 * ═══════════════════════════════════════════════════════════════
 */
import { LLMProvider, ChatMessage, LLMOptions, Logger } from '@codex-types/index';
export declare class CustomProvider implements LLMProvider {
    id: "custom";
    name: string;
    models: string[];
    private apiKey;
    private baseURL;
    private logger;
    constructor(baseURL?: string, apiKey?: string, logger?: Logger);
    isAvailable(): Promise<boolean>;
    chat(messages: ChatMessage[], options?: LLMOptions): Promise<string>;
    stream(messages: ChatMessage[], onToken: (token: string) => void, options?: LLMOptions): Promise<string>;
    countTokens(text: string): number;
    private makeRequest;
    private makeStreamingRequest;
}
export default CustomProvider;
//# sourceMappingURL=custom-provider.d.ts.map