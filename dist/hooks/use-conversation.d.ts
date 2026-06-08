/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Conversation Hook - Cod3x Code v4.0
 * Developed by CodexHaven
 * ═══════════════════════════════════════════════════════════════
 */
import { ChatMessage, Config, Logger, ConversationMemory } from '@codex-types/index';
interface UseConversationOptions {
    config: Config;
    logger: Logger;
    memory: ConversationMemory;
}
export declare function useConversation({ config, logger, memory }: UseConversationOptions): {
    messages: ChatMessage[];
    sendMessage: (content: string, role?: ChatMessage["role"]) => void;
    clearMessages: () => void;
    compact: () => Promise<void>;
};
export default useConversation;
//# sourceMappingURL=use-conversation.d.ts.map