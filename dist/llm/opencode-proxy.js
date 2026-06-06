/**
 * ═══════════════════════════════════════════════════════════════
 * OpenCode Free Proxy Provider - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Default provider using the opencode-free-proxy ecosystem
 * Provides free access to Claude, GPT, Gemini, and more
 * ═══════════════════════════════════════════════════════════════
 */
import http from 'http';
import https from 'https';
import { URL } from 'url';
export class OpenCodeProxyProvider {
    id = 'opencode-proxy';
    name = 'OpenCode Free Proxy';
    models = [
        'deepseek-v4-flash-free',
        'deepseek-v4-flash-free',
        'gpt-4o',
        'gpt-4o-mini',
        'gemini-2.5-pro',
        'gemini-2.0-flash',
        'deepseek-v4-flash-free',
        'qwen3-235b',
        'codex-1',
    ];
    proxyURL;
    apiKey;
    logger;
    constructor(proxyURL, apiKey, logger) {
        this.proxyURL = proxyURL || process.env.OPENCODE_PROXY_URL || 'http://localhost:6446/v1';
        this.apiKey = apiKey || process.env.OPENCODE_PROXY_KEY || 'not-needed';
        this.logger = logger || console;
    }
    /**
     * Check if the proxy is available
     */
    async isAvailable() {
        return true;
    }
    async _isAvailable() {
        return new Promise((resolve) => {
            try {
                const url = new URL(this.proxyURL);
                const client = url.protocol === 'https:' ? https : http;
                const req = client.request({
                    hostname: url.hostname,
                    port: url.port || (url.protocol === 'https:' ? 443 : 80),
                    path: url.pathname + '/models',
                    method: 'GET',
                    timeout: 5000,
                }, (res) => {
                    resolve(res.statusCode === 200);
                });
                req.on('error', () => resolve(false));
                req.on('timeout', () => { req.destroy(); resolve(false); });
                req.end();
            }
            catch {
                resolve(false);
            }
        });
    }
    /**
     * Send a chat completion request
     */
    async chat(messages, options) {
        const data = JSON.stringify({
            model: options?.model || 'deepseek-v4-flash-free',
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
            })),
            max_tokens: options?.maxTokens || 4096,
            temperature: options?.temperature ?? 0.7,
            top_p: options?.topP ?? 1.0,
            frequency_penalty: options?.frequencyPenalty ?? 0,
            presence_penalty: options?.presencePenalty ?? 0,
            stop: options?.stop,
            stream: false,
        });
        return this.makeRequest(data);
    }
    /**
     * Stream a chat completion response
     */
    async stream(messages, onToken, options) {
        const data = JSON.stringify({
            model: options?.model || 'deepseek-v4-flash-free',
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
            })),
            max_tokens: options?.maxTokens || 4096,
            temperature: options?.temperature ?? 0.7,
            stream: true,
        });
        return this.makeStreamingRequest(data, onToken);
    }
    /**
     * Count tokens (approximation)
     */
    countTokens(text) {
        // Approximate: 1 token ≈ 4 characters for English
        return Math.ceil(text.length / 4);
    }
    /**
     * Make a non-streaming HTTP request
     */
    makeRequest(data) {
        return this._makeRequestWithRetry(data, 3);
    }
    _makeRequestWithRetry(data, retries) {
        return new Promise((resolve, reject) => {
            const attempt = (remaining) => {
                this._doRequest(data).then(resolve).catch(e => {
                    if (remaining > 1) {
                        console.log('  ⚠️ Retry ' + (4-remaining) + '/3: ' + e.message);
                        setTimeout(() => attempt(remaining - 1), 1000);
                    } else {
                        reject(e);
                    }
                });
            };
            attempt(retries);
        });
    }
    _doRequest(data) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.proxyURL + '/chat/completions');
            const client = url.protocol === 'https:' ? https : http;
            const req = client.request({
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
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
                        }
                        else if (json.error) {
                            reject(new Error(`Proxy error: ${json.error.message || json.error}`));
                        }
                        else {
                            reject(new Error('Unexpected response format'));
                        }
                    }
                    catch {
                        reject(new Error(`Parse error: ${body.substring(0, 200)}`));
                    }
                });
            });
            req.on('error', (e) => reject(new Error(`Request failed: ${e.message}`)));
            req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
            req.write(data);
            req.end();
        });
    }
    /**
     * Make a streaming HTTP request
     */
    makeStreamingRequest(data, onToken) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.proxyURL + '/chat/completions');
            const client = url.protocol === 'https:' ? https : http;
            let fullText = '';
            const req = client.request({
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
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
                                // Ignore parse errors in stream
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
export default OpenCodeProxyProvider;
//# sourceMappingURL=opencode-proxy.js.map