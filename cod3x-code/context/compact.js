export class ConversationCompacter {
  constructor(options = {}) {
    this.maxTokens = options.maxTokens || 4000;
    this.preserveLast = options.preserveLast || 10;
    this.llm = options.llm || null;
  }
  
  estimateTokens(text) {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
  
  async compact(conversation, options = {}) {
    const maxTokens = options.maxTokens || this.maxTokens;
    const preserveLast = options.preserveLast || this.preserveLast;
    
    if (conversation.length <= preserveLast) {
      return conversation;
    }
    
    const currentTokens = this.estimateConversationTokens(conversation);
    if (currentTokens <= maxTokens) {
      return conversation;
    }
    
    // Separate old and recent messages
    const recentMessages = conversation.slice(-preserveLast);
    const oldMessages = conversation.slice(0, -preserveLast);
    
    // Create summary of old messages
    let summary = '';
    
    if (this.llm && oldMessages.length > 5) {
      try {
        summary = await this.summarizeWithLLM(oldMessages);
      } catch (error) {
        summary = this.summarizeManually(oldMessages);
      }
    } else {
      summary = this.summarizeManually(oldMessages);
    }
    
    // Create compacted conversation
    const compacted = [
      {
        role: 'system',
        content: `[Previous conversation summary: ${summary}]`,
        compressed: true,
        originalCount: oldMessages.length
      },
      ...recentMessages
    ];
    
    return compacted;
  }
  
  async summarizeWithLLM(messages) {
    const conversationText = messages.map(m => 
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 500)}`
    ).join('\n');
    
    const summaryPrompt = `Summarize this conversation, keeping only:
- Key decisions made
- Important code written or changed
- Project requirements discussed
- Critical context for future messages

Keep it under 500 characters.

Conversation:
${conversationText}

Summary:`;
    
    const summary = await this.llm.chat(summaryPrompt);
    return summary.slice(0, 500);
  }
  
  summarizeManually(messages) {
    const keyPoints = [];
    const importantKeywords = ['implement', 'create', 'change', 'fix', 'add', 'remove', 'update', 'refactor'];
    
    for (const message of messages) {
      const lowerContent = message.content.toLowerCase();
      for (const keyword of importantKeywords) {
        if (lowerContent.includes(keyword)) {
          const sentences = message.content.split(/[.!?]+/);
          for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(keyword)) {
              keyPoints.push(sentence.trim());
              if (keyPoints.length >= 10) break;
            }
          }
          break;
        }
      }
      if (keyPoints.length >= 10) break;
    }
    
    const summary = keyPoints.slice(0, 10).join('. ') + '.';
    return summary.length > 500 ? summary.slice(0, 500) : summary;
  }
  
  estimateConversationTokens(conversation) {
    let total = 0;
    for (const message of conversation) {
      total += this.estimateTokens(message.content);
      if (message.role === 'system') total += 50; // System message overhead
    }
    return total;
  }
  
  shouldCompact(conversation, maxTokens = 4000) {
    const estimated = this.estimateConversationTokens(conversation);
    return estimated > maxTokens;
  }
  
  async autoCompact(conversation, options = {}) {
    if (!this.shouldCompact(conversation, options.maxTokens)) {
      return { compacted: false, conversation: conversation };
    }
    
    const compacted = await this.compact(conversation, options);
    return { 
      compacted: true, 
      conversation: compacted,
      originalSize: conversation.length,
      newSize: compacted.length,
      tokensSaved: this.estimateConversationTokens(conversation) - this.estimateConversationTokens(compacted)
    };
  }
}

export default ConversationCompacter;
