/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Chat Interface - Cod3x Code v4.0
 * Developed by CodexHaven
 * ═══════════════════════════════════════════════════════════════
 */
import React from 'react';
import { ChatMessage, Config, DebugTrail } from '@codex-types/index';
interface ChatInterfaceProps {
    messages: ChatMessage[];
    onSendMessage: (content: string) => Promise<void>;
    onSlashCommand: (command: string, args: string[]) => Promise<void>;
    isThinking: boolean;
    isStreaming: boolean;
    config: Config;
    trail?: DebugTrail;
}
export declare const ChatInterface: React.FC<ChatInterfaceProps>;
export default ChatInterface;
//# sourceMappingURL=chat.d.ts.map