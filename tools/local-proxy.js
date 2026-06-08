#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 * Cod3x Code v4.0 - Local Ollama Speed Proxy
 * Developed by CodexHaven
 *
 * HTTP proxy that sits between Cod3x and Ollama to improve
 * local inference speed. Trims oversized system prompts to
 * reduce first-token latency from 60-120s to 5-20s.
 *
 * Usage: node local-proxy.js [port]
 * Default port: 11435 (forwards to Ollama at 11434)
 * ═══════════════════════════════════════════════════════════════
 */

const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');

const PROXY_PORT = parseInt(process.argv[2] || process.env.COD3X_PROXY_PORT || '11435', 10);
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const LOG_FILE = path.join(process.env.COD3X_HOME || process.cwd(), 'logs', 'proxy.log');

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ─── Logger ───
function log(level, message, data) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ' ' + JSON.stringify(data).slice(0, 500) : ''}`;

  // Write to log file silently (never to stdout)
  try {
    fs.appendFileSync(LOG_FILE, entry + '\n');
  } catch {
    // If logging fails, silently ignore
  }
}

// ─── System Prompt Trimmer ───
function trimSystemPrompt(body) {
  try {
    const data = JSON.parse(body);

    if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
      const firstMessage = data.messages[0];

      if (firstMessage.role === 'system' && firstMessage.content) {
        const originalLength = firstMessage.content.length;
        const maxChars = 1200; // Approx. 300 tokens

        if (originalLength > maxChars) {
          firstMessage.content = firstMessage.content.substring(0, maxChars) +
            '\n[...truncated for local inference speed...]';

          log('info', 'Trimmed system prompt', {
            originalChars: originalLength,
            trimmedChars: firstMessage.content.length,
            reduction: `${Math.round((1 - firstMessage.content.length / originalLength) * 100)}%`,
          });
        }
      }

      return JSON.stringify(data);
    }

    // Also handle legacy 'prompt' field for /v1/completions
    if (data.prompt && typeof data.prompt === 'string') {
      const maxChars = 1200;
      if (data.prompt.length > maxChars) {
        data.prompt = data.prompt.substring(0, maxChars) +
          '\n[...truncated for local inference speed...]';
      }
      return JSON.stringify(data);
    }
  } catch {
    // Not valid JSON, return original
  }

  return body;
}

// ─── Proxy Setup ───
const proxy = httpProxy.createProxyServer({
  target: OLLAMA_HOST,
  changeOrigin: true,
  selfHandleResponse: false,
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  log('error', 'Proxy error', { error: err.message, url: req.url });

  if (res && !res.headersSent) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: {
        message: 'Ollama is not available. Please make sure Ollama is running on ' + OLLAMA_HOST,
        type: 'proxy_error',
        code: 'ollama_unavailable',
      },
    }));
  }
});

// ─── Server ───
const server = http.createServer((req, res) => {
  log('info', `${req.method} ${req.url}`, { headers: req.headers });

  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', proxy: true, target: OLLAMA_HOST }));
    return;
  }

  // Handle chat completions and completions endpoints
  if (req.method === 'POST' && (req.url === '/v1/chat/completions' || req.url === '/v1/completions')) {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Trim system prompt
      const modifiedBody = trimSystemPrompt(body);

      log('debug', 'Forwarding request', {
        endpoint: req.url,
        bodyLength: modifiedBody.length,
        originalLength: body.length,
      });

      // Create a new request stream from modified body
      const { Buffer } = require('buffer');
      const bodyBuffer = Buffer.from(modifiedBody, 'utf-8');

      // Update headers for modified body
      req.headers['content-length'] = String(bodyBuffer.length);

      // Forward with modified body
      proxy.web(req, res, {
        target: OLLAMA_HOST,
        changeOrigin: true,
        selfHandleResponse: false,
        buffer: require('stream').Readable.from([bodyBuffer]),
      });
    });

    return;
  }

  // Forward all other requests as-is
  proxy.web(req, res);
});

// ─── Start ───
server.listen(PROXY_PORT, '127.0.0.1', () => {
  console.log(`🚀 Cod3x Local Ollama Speed Proxy`);
  console.log(`═══════════════════════════════════════════`);
  console.log(`   Proxy:    http://localhost:${PROXY_PORT}`);
  console.log(`   Target:   ${OLLAMA_HOST}`);
  console.log(`   Logs:     ${LOG_FILE}`);
  console.log(`═══════════════════════════════════════════`);
  console.log('');
  console.log('This proxy trims oversized system prompts to improve');
  console.log('local inference speed. Configure Cod3x to use:');
  console.log(`   BASE_URL=http://localhost:${PROXY_PORT}/v1`);
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');

  log('info', 'Proxy started', { port: PROXY_PORT, target: OLLAMA_HOST });
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('info', 'Proxy shutting down');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  log('info', 'Proxy shutting down (SIGTERM)');
  server.close(() => {
    process.exit(0);
  });
});
