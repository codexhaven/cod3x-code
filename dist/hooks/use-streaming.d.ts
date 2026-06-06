/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Streaming Hook - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Unified streaming via LLMProviderFactory with fallback
 * ═══════════════════════════════════════════════════════════════
 */
import { Config, Logger, LLMProviderFactory } from '@codex-types/index';
interface UseStreamingOptions {
    config: Config;
    logger: Logger;
    llmFactory: LLMProviderFactory;
}
export declare function useStreaming({ config, logger, llmFactory }: UseStreamingOptions): {
    streamResponse: any;
    isStreaming: any;
};
export default useStreaming;
//# sourceMappingURL=use-streaming.d.ts.map