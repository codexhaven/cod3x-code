/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Conversation Memory - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Persistent conversation storage with SQLite (when available)
 * and JSON file fallback for all platforms including Termux.
 * Supports session-based save/load for portable mode.
 * ═══════════════════════════════════════════════════════════════
 */
import { ConversationMemory as IConversationMemory, ChatMessage, MemoryEntry } from '@codex-types/index';
export declare class ConversationMemory implements IConversationMemory {
    private messages;
    private tokenCount;
    private entries;
    private memoryPath;
    private dbPath;
    private sqlite;
    private useSQLite;
    private currentSessionId;
    constructor(cwd?: string);
    private initSQLite;
    addMessage(role: ChatMessage['role'], content: string): Promise<void>;
    getMessages(limit?: number): Promise<ChatMessage[]>;
    getTokenCount(): number;
    compact(): Promise<void>;
    addEntry(entry: MemoryEntry): Promise<void>;
    search(query: string, limit?: number): MemoryEntry[];
    private persist;
    load(): Promise<void>;
    /**
     * Save current conversation as a named session
     */
    saveSession(sessionId: string): Promise<void>;
    /**
     * Load a named session
     */
    loadSession(sessionId: string): Promise<boolean>;
    /**
     * List all available session IDs
     */
    listSessions(): Promise<string[]>;
    /**
     * Get current session ID if any
     */
    getCurrentSessionId(): string | null;
    /**
     * Get conversation statistics
     */
    getStats(): {
        messageCount: number;
        entryCount: number;
        tokenCount: number;
        storage: string;
    };
    /**
     * Export memory to various formats
     */
    export(format: 'json' | 'md'): string;
    /**
     * Clear all memory
     */
    clear(): Promise<void>;
}
export default ConversationMemory;
//# sourceMappingURL=conversation.d.ts.map