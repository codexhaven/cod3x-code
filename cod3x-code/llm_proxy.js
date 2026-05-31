import { EventEmitter } from 'events';
import { generate } from '../proxy.js';

export class LLMProxy extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
  }

  async initialize() {
    console.log('  🔗 Using OpenCode Free Proxy');
    console.log('  🤖 Model: deepseek-v4-flash-free');
    return true;
  }

  async chat(messages, options = {}) {
    // Extract the last user message
    const userMessages = Array.isArray(messages) 
      ? messages.filter(m => m.role === 'user')
      : [{ role: 'user', content: messages }];
    
    const lastUserMessage = userMessages[userMessages.length - 1];
    const prompt = lastUserMessage?.content || messages;
    
    try {
      const response = await generate(prompt, {
        model: options.model || 'deepseek-v4-flash-free',
        maxTokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      });
      return response;
    } catch (error) {
      console.error('Proxy error:', error.message);
      return `I'm having trouble connecting. ${error.message}`;
    }
  }

  async streamChat(messages, onToken, options = {}) {
    const response = await this.chat(messages, options);
    for (const char of response) {
      onToken(char);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    return response;
  }
}

export default LLMProxy;
