/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Conversation Hook - Cod3x Code v4.0
 * Developed by CodexHaven
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react';
import { ChatMessage, Config, Logger, ConversationMemory } from '@codex-types/index';

interface UseConversationOptions {
  config: Config;
  logger: Logger;
  memory: ConversationMemory;
}

export function useConversation({ config, logger, memory }: UseConversationOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sendMessage = useCallback((content: string, role: ChatMessage['role'] = 'assistant') => {
    const message: ChatMessage = { role, content };
    setMessages((prev) => [...prev, message]);
    memory.addMessage(role, content).catch(() => {});
    logger.debug('Message added', { role, contentLength: content.length });
  }, [logger, memory]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    logger.debug('Conversation cleared');
  }, [logger]);

  const compact = useCallback(async () => {
    logger.info('Compacting conversation');
    if (messages.length <= 10) return;
    
    const summary = `Previous conversation with ${messages.length} messages covering multiple topics`;
    setMessages([{ role: 'system', content: `[Summary by Cod3x] ${summary}` }]);
    await memory.compact();
  }, [messages, logger, memory]);

  return { messages, sendMessage, clearMessages, compact };
}

export default useConversation;
