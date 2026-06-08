/**
 * ═══════════════════════════════════════════════════════════════
 * Custom/OpenAI-Compatible Provider - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Generic provider for any OpenAI-compatible API endpoint
 * ═══════════════════════════════════════════════════════════════
 */
import http from 'http';
import https from 'https';
import { URL } from 'url';
export class CustomProvider {
    id = 'custom';
    name = 'Custom/OpenAI-Compatible';
    models = [];
    apiKey;
    baseURL;
    logger;
    constructor(baseURL, apiKey, logger) {
        this.baseURL = baseURL || process.env.COD3X_CUSTOM_BASE_URL || 'http://localhost:11434/v1';
        this.apiKey = apiKey || process.env.COD3X_CUSTOM_API_KEY || '';
        this.logger = logger || console;
    }
    async isAvailable() {
        return new Promise((resolve) => {
            try {
                const url = new URL(this.baseURL + '/models');
                const client = url.protocol === 'https:' ? https : http;
                const headers = {};
                if (this.apiKey)
                    headers['Authorization'] = `Bearer ${this.apiKey}`;
                const req = client.request({
                    hostname: url.hostname,
                    port: url.port || (url.protocol === 'https:' ? 443 : 80),
                    path: url.pathname,
                    method: 'GET',
                    headers,
                    timeout: 5000,
                }, (res) => resolve(res.statusCode === 200));
                req.on('error', () => resolve(false));
                req.on('timeout', () => { req.destroy(); resolve(false); });
                req.end();
            }
            catch {
                resolve(false);
            }
        });
    }
    async chat(messages, options) {
        const data = JSON.stringify({
            model: options?.model || 'default',
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            max_tokens: options?.maxTokens || 4096,
            temperature: options?.temperature ?? 0.7,
            top_p: options?.topP ?? 1.0,
            stream: false,
        });
        return this.makeRequest(data);
    }
    async stream(messages, onToken, options) {
        const data = JSON.stringify({
            model: options?.model || 'default',
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            max_tokens: options?.maxTokens || 4096,
            temperature: options?.temperature ?? 0.7,
            stream: true,
        });
        return this.makeStreamingRequest(data, onToken);
    }
    countTokens(text) {
        return Math.ceil(text.length / 4);
    }
    makeRequest(data) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.baseURL + '/chat/completions');
            const client = url.protocol === 'https:' ? https : http;
            const headers = {
                'Content-Type': 'application/json',
                'Content-Length': String(Buffer.byteLength(data)),
            };
            if (this.apiKey)
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            const req = client.request({
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers,
                timeout: 120000,
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(body);
                        if (json.choices?.[0]?.message?.content) {
                            resolve(json.choices[0].message.content);
                        }
                        else if (json.error) {
                            reject(new Error(`Custom API error: ${json.error.message || json.error}`));
                        }
                        else {
                            reject(new Error('Unexpected response from custom API'));
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
    makeStreamingRequest(data, onToken) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.baseURL + '/chat/completions');
            const client = url.protocol === 'https:' ? https : http;
            const headers = {
                'Content-Type': 'application/json',
                'Content-Length': String(Buffer.byteLength(data)),
                'Accept': 'text/event-stream',
            };
            if (this.apiKey)
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            let fullText = '';
            const req = client.request({
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers,
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
                                const content = json.choices?.[0]?.delta?.content || '';
                                if (content) {
                                    fullText += content;
                                    onToken(content);
                                }
                            }
                            catch {
                                // Ignore
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
export default CustomProvider;
//# sourceMappingURL=custom-provider.js.map