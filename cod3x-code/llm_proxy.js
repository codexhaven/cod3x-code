import { EventEmitter } from 'events';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env file
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...vals] = trimmed.split('=');
        if (key && vals.length) {
          process.env[key.trim()] = vals.join('=').trim();
        }
      }
    });
  }
}
loadEnv();

export class LLMProxy extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      apiUrl: process.env.COD3X_API_URL || 'http://localhost:6446/v1',
      apiKey: process.env.COD3X_API_KEY || process.env.OPENROUTER_API_KEY || '',
      model: process.env.COD3X_MODEL || 'deepseek-v4-flash-free',
      temperature: 0.7,
      maxTokens: 4096,
      ...config
    };
  }

  async initialize() {
    console.log(`  🔗 Proxy: ${this.config.apiUrl}`);
    console.log(`  🤖 Model: ${this.config.model}`);
    
    if (!this.config.apiKey) {
      console.log('  ⚠️ No API key found, but trying anyway...');
    }
    
    // Test connection
    try {
      const test = await this.testConnection();
      if (test) {
        console.log('  ✓ Proxy connected successfully');
      } else {
        console.log('  ⚠️ Proxy connection failed, will retry on each request');
      }
    } catch (error) {
      console.log(`  ⚠️ Proxy not responding: ${error.message}`);
    }
    
    return true;
  }

  async testConnection() {
    try {
      const response = await this.chat('Say "OK" in one word');
      return response && response.includes('OK');
    } catch {
      return false;
    }
  }

  async chat(messages, options = {}) {
    const url = new URL(this.config.apiUrl + '/chat/completions');
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const requestBody = JSON.stringify({
      model: options.model || this.config.model,
      messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
      temperature: options.temperature || this.config.temperature,
      max_tokens: options.maxTokens || this.config.maxTokens,
      stream: false
    });

    return new Promise((resolve, reject) => {
      const req = httpModule.request({
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Length': Buffer.byteLength(requestBody)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.choices && json.choices[0]) {
              resolve(json.choices[0].message.content);
            } else if (json.error) {
              reject(new Error(json.error.message || json.error));
            } else {
              // Try to extract response anyway
              if (data && data.length < 500) {
                resolve(data);
              } else {
                reject(new Error(`Unexpected response: ${data.slice(0, 200)}`));
              }
            }
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Proxy connection failed: ${error.message}\n\nMake sure your proxy is running:\n  cd ~/opencode-free-proxy && node server.mjs`));
      });

      req.write(requestBody);
      req.end();
    });
  }

  async streamChat(messages, onToken, options = {}) {
    // For now, use non-streaming
    const response = await this.chat(messages, options);
    for (const char of response) {
      onToken(char);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    return response;
  }
}

export default LLMProxy;
