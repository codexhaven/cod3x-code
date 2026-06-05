/**
 * ═══════════════════════════════════════════════════════════════
 * OpenAI Provider - Cod3x Code v4.0
 * Developed by CodexHaven
 * 
 * Direct OpenAI API integration
 * ═══════════════════════════════════════════════════════════════
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import { LLMProvider, ChatMessage, LLMOptions, Logger } from '@codex-types/index';

export class OpenAIProvider implements LLMProvider {
  id = 'openai' as const;
  name = 'OpenAI';
  models = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    'o3-mini',
  ];

  private apiKey: string;
  private baseURL: string;
  private logger: Logger;

  constructor(apiKey?: string, baseURL?: string, logger?: Logger) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.baseURL = baseURL || 'https://api.openai.com/v1';
    this.logger = logger || console as unknown as Logger;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    return new Promise((resolve) => {
      const url = new URL(this.baseURL + '/models');
      const client = url.protocol === 'https:' ? https : http;
      const req = client.request({
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 5000,
      }, (res) => resolve(res.statusCode === 200));
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    });
  }

  async chat(messages: ChatMessage[], options?: LLMOptions): Promise<string> {
    const data = JSON.stringify({
      model: options?.model || 'gpt-4o',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.7,
      top_p: options?.topP ?? 1.0,
      frequency_penalty: options?.frequencyPenalty ?? 0,
      presence_penalty: options?.presencePenalty ?? 0,
      stream: false,
    });

    return this.makeRequest(data);
  }

  async stream(messages: ChatMessage[], onToken: (token: string) => void, options?: LLMOptions): Promise<string> {
    const data = JSON.stringify({
      model: options?.model || 'gpt-4o',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.7,
      stream: true,
    });

    return this.makeStreamingRequest(data, onToken);
  }

  countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private makeRequest(data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseURL + '/chat/completions');
      const client = url.protocol === 'https:' ? https : http;
      const req = client.request({
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 120000,
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (json.choices?.[0]?.message?.content) {
              resolve(json.choices[0].message.content);
            } else if (json.error) {
              reject(new Error(`OpenAI error: ${json.error.message || json.error}`));
            } else {
              reject(new Error('Unexpected OpenAI response'));
            }
          } catch {
            reject(new Error(`Parse error: ${body.slice(0, 200)}`));
          }
        });
      });
      req.on('error', (e) => reject(new Error(`Request failed: ${e.message}`)));
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
      req.write(data);
      req.end();
    });
  }

  private makeStreamingRequest(data: string, onToken: (token: string) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseURL + '/chat/completions');
      const client = url.protocol === 'https:' ? https : http;
      let fullText = '';
      const req = client.request({
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(data),
          'Accept': 'text/event-stream',
        },
        timeout: 300000,
      }, (res) => {
        res.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              if (jsonStr === '[DONE]') continue;
              try {
                const json = JSON.parse(jsonStr);
                const content = json.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullText += content;
                  onToken(content);
                }
              } catch {
                // Ignore
              }
            }
          }
        });
        res.on('end', () => resolve(fullText));
      });
      req.on('error', (e) => {
        if (fullText) resolve(fullText);
        else reject(new Error(`Stream error: ${e.message}`));
      });
      req.on('timeout', () => {
        req.destroy();
        if (fullText) resolve(fullText);
        else reject(new Error('Stream timeout'));
      });
      req.write(data);
      req.end();
    });
  }
}

export default OpenAIProvider;
