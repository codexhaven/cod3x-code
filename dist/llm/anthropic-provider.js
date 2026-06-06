/**
 * ═══════════════════════════════════════════════════════════════
 * Anthropic Provider - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Direct Anthropic API integration for Claude models
 * ═══════════════════════════════════════════════════════════════
 */
import http from 'http';
import https from 'https';
import { URL } from 'url';
export class AnthropicProvider {
    id = 'anthropic';
    name = 'Anthropic Claude';
    models = [
        'claude-sonnet-4-20250514',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
    ];
    apiKey;
    baseURL;
    logger;
    constructor(apiKey, baseURL, logger) {
        this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
        this.baseURL = baseURL || 'https://api.anthropic.com/v1';
        this.logger = logger || console;
    }
    async isAvailable() {
        if (!this.apiKey)
            return false;
        return new Promise((resolve) => {
            const url = new URL(this.baseURL + '/models');
            const client = url.protocol === 'https:' ? https : http;
            const req = client.request({
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'GET',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                },
                timeout: 5000,
            }, (res) => resolve(res.statusCode === 200));
            req.on('error', () => resolve(false));
            req.on('timeout', () => { req.destroy(); resolve(false); });
            req.end();
        });
    }
    async chat(messages, options) {
        const systemMsg = messages.find(m => m.role === 'system');
        const chatMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
        }));
        const data = JSON.stringify({
            model: options?.model || 'claude-sonnet-4-20250514',
            max_tokens: options?.maxTokens || 4096,
            temperature: options?.temperature ?? 0.7,
            top_p: options?.topP ?? 1.0,
            system: systemMsg?.content || '',
            messages: chatMessages,
        });
        return this.makeRequest(data, options?.model);
    }
    async stream(messages, onToken, options) {
        const systemMsg = messages.find(m => m.role === 'system');
        const chatMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
        }));
        const data = JSON.stringify({
            model: options?.model || 'claude-sonnet-4-20250514',
            max_tokens: options?.maxTokens || 4096,
            temperature: options?.temperature ?? 0.7,
            system: systemMsg?.content || '',
            messages: chatMessages,
            stream: true,
        });
        return this.makeStreamingRequest(data, onToken, options?.model);
    }
    countTokens(text) {
        return Math.ceil(text.length / 4);
    }
    makeRequest(data, model) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.baseURL + '/messages');
            const client = url.protocol === 'https:' ? https : http;
            const req = client.request({
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Length': Buffer.byteLength(data),
                },
                timeout: 120000,
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(body);
                        if (json.content?.[0]?.text) {
                            resolve(json.content[0].text);
                        }
                        else if (json.error) {
                            reject(new Error(`Anthropic error: ${json.error.message || json.error}`));
                        }
                        else {
                            reject(new Error('Unexpected Anthropic response'));
                        }
                    }
                    catch {
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
    makeStreamingRequest(data, onToken, model) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.baseURL + '/messages');
            const client = url.protocol === 'https:' ? https : http;
            let fullText = '';
            const req = client.request({
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Length': Buffer.byteLength(data),
                    'Accept': 'text/event-stream',
                },
                timeout: 300000,
            }, (res) => {
                res.on('data', (chunk) => {
                    const lines = chunk.toString().split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const jsonStr = line.slice(6);
                            if (jsonStr === '[DONE]')
                                continue;
                            try {
                                const json = JSON.parse(jsonStr);
                                const content = json.delta?.text || json.content_block?.text || '';
                                if (content) {
                                    fullText += content;
                                    onToken(content);
                                }
                            }
                            catch {
                                // Ignore parse errors
                            }
                        }
                    }
                });
                res.on('end', () => resolve(fullText));
            });
            req.on('error', (e) => {
                if (fullText)
                    resolve(fullText);
                else
                    reject(new Error(`Stream error: ${e.message}`));
            });
            req.on('timeout', () => {
                req.destroy();
                if (fullText)
                    resolve(fullText);
                else
                    reject(new Error('Stream timeout'));
            });
            req.write(data);
            req.end();
        });
    }
}
export default AnthropicProvider;
//# sourceMappingURL=anthropic-provider.js.map