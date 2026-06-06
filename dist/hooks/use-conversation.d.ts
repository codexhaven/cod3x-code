/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Conversation Hook - Cod3x Code v4.0
 * Developed by CodexHaven
 * ═══════════════════════════════════════════════════════════════
 */
import { Config, Logger, ConversationMemory } from '@codex-types/index';
interface UseConversationOptions {
    config: Config;
    logger: Logger;
    memory: ConversationMemory;
}
export declare function useConversation({ config, logger, memory }: UseConversationOptions): {
    messages: any;
    sendMessage: any;
    clearMessages: any;
    compact: any;
};
export default useConversation;
//# sourceMappingURL=use-conversation.d.ts.map