#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 * Cod3x Web Server - Cod3x Code v4.0
 * Developed by CodexHaven
 * 
 * Standalone web server that serves a clean web UI and connects
 * to the REAL Cod3x agent system via compiled dist/ code.
 * 
 * Usage: node server.mjs [port]
 * Default port: 9000
 * ═══════════════════════════════════════════════════════════════
 */

import http from 'http';
import https from 'https';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.argv[2] || process.env.COD3X_PORT || '9000', 10);

// ─── State ───
let cod3x = null;
let serverStartTime = Date.now();
let requestCount = 0;
let chatSessions = new Map();

// ─── Initialize Cod3x Backend ───
async function initCod3x() {
  try {
    // Check if dist/ exists, if not try to build
    const distPath = path.join(__dirname, 'dist');
    try {
      await fs.access(distPath);
    } catch {
      console.log('📦 dist/ not found, attempting to build...');
      try {
        execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });
      } catch {
        console.log('⚠️  Build failed. Run "npm run build" first, or use "npm run dev" for development.');
        return false;
      }
    }

    // Register path aliases for Node.js
    const { register } = await import('node:module');
    if (register) {
      try {
        await import('./register-paths.mjs');
      } catch {
        // Path resolver may not be needed on some setups
      }
    }

    // Dynamic imports from dist/
    const { ConfigLoader } = await import('./dist/config/loader.js');
    const { ToolRegistry } = await import('./dist/core/tool-registry.js');
    const { AgentOrchestrator } = await import('./dist/agents/orchestrator.js');
    const { LLMProviderFactory } = await import('./dist/llm/provider.js');
    const { Logger } = await import('./dist/utils/logger.js');
    const { ConversationMemory } = await import('./dist/memory/conversation.js');
    const { PlatformDetector } = await import('./dist/platform/detector.js');

    const platformDetector = PlatformDetector.getInstance();
    const platformInfo = await platformDetector.detect();
    platformDetector.applyEnvironment(platformInfo);

    const configLoader = new ConfigLoader();
    const config = await configLoader.load();

    const logger = new Logger(config.logging);
    const toolRegistry = new ToolRegistry();
    const memory = new ConversationMemory();
    const llmFactory = new LLMProviderFactory(config, logger);
    const agentOrchestrator = new AgentOrchestrator(config.agents, llmFactory.getPrimary(), logger, toolRegistry);

    agentOrchestrator.initializeSwarm(config.swarm);

    await logger.initialize();
    await toolRegistry.loadDefaults();
    await memory.load();

    cod3x = {
      config,
      logger,
      toolRegistry,
      memory,
      llmFactory,
      agentOrchestrator,
      platform: platformInfo,
    };

    console.log(`✅ Cod3x backend initialized`);
    console.log(`   Platform: ${platformInfo.type}`);
    console.log(`   Tools: ${toolRegistry.list().length}`);
    console.log(`   Agents: ${agentOrchestrator.getAgents().length}`);
    console.log(`   LLM: ${config.ai.model} (${config.ai.provider})`);

    const availability = await llmFactory.checkAvailability();
    const available = availability.filter(a => a.available);
    if (available.length === 0) {
      console.log(`⚠️  No LLM providers available. Set API keys or start opencode-proxy.`);
    } else {
      console.log(`   Available providers: ${available.map(a => a.type).join(', ')}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Cod3x:', error.message);
    console.log('\nFallback mode: Server will run with limited functionality.');
    cod3x = null;
    return false;
  }
}

// ─── API Handlers ───
const apiHandlers = {
  // GET /api/status
  async status() {
    const llmStatus = cod3x ? await cod3x.llmFactory.checkAvailability() : [];
    return {
      success: true,
      data: {
        version: '4.0.0',
        platform: cod3x?.platform?.type || os.platform(),
        tools: cod3x?.toolRegistry?.list().length || 0,
        agents: cod3x?.agentOrchestrator?.getAgents().length || 0,
        llm: {
          provider: cod3x?.config?.ai?.provider || 'none',
          model: cod3x?.config?.ai?.model || 'none',
          available: llmStatus.filter(a => a.available).map(a => a.type),
        },
        uptime: Date.now() - serverStartTime,
        requests: requestCount,
        sessions: chatSessions.size,
      },
    };
  },

  // GET /api/tools
  async tools() {
    if (!cod3x) return { success: false, error: 'Cod3x not initialized' };
    const tools = cod3x.toolRegistry.list().map(t => ({
      name: t.name,
      description: t.description,
      category: t.category,
      requiresApproval: t.requiresApproval,
      parameters: t.parameters,
    }));
    return { success: true, data: { count: tools.length, tools } };
  },

  // GET /api/agents
  async agents() {
    if (!cod3x) return { success: false, error: 'Cod3x not initialized' };
    const agents = cod3x.agentOrchestrator.getAgents().map(a => ({
      id: a.id,
      name: a.name,
      role: a.role,
      description: a.description,
      tools: a.tools,
    }));
    return { success: true, data: { count: agents.length, agents } };
  },

  // POST /api/chat
  async chat(body) {
    if (!cod3x) return { success: false, error: 'Cod3x not initialized' };
    
    const { message, sessionId = 'default', model, temperature } = body;
    if (!message) return { success: false, error: 'Message is required' };

    const session = chatSessions.get(sessionId) || { messages: [], createdAt: Date.now() };
    session.messages.push({ role: 'user', content: message, timestamp: Date.now() });
    chatSessions.set(sessionId, session);

    try {
      // Detect special commands
      if (message.startsWith('!agent ')) {
        const parts = message.slice(7).split(' ');
        const role = parts[0];
        const task = parts.slice(1).join(' ');
        const result = await cod3x.agentOrchestrator.executeAgent(role, {
          id: `web-${Date.now()}`,
          description: task,
        });
        session.messages.push({ role: 'assistant', content: result.output || result.summary, timestamp: Date.now() });
        return { success: true, data: { response: result.output || result.summary, agent: role, type: 'agent' } };
      }

      if (message.startsWith('!swarm ') || message.includes('use swarm')) {
        const objective = message.replace('!swarm ', '').replace('use swarm', '').trim();
        const result = await cod3x.agentOrchestrator.executeSwarm(objective);
        session.messages.push({ role: 'assistant', content: result.output || result.summary, timestamp: Date.now() });
        return { success: true, data: { response: result.output || result.summary, type: 'swarm', summary: result.summary } };
      }

      // Regular chat with tool support
      const systemPrompt = `You are Cod3x, an expert AI coding assistant developed by CodexHaven.
When you need to use a tool, format: <cod3x-tool>tool_name</cod3x-tool> followed by <cod3x-params>{"param": "value"}</cod3x-params>
Available tool categories: filesystem, execution, git, code, search, network, browser, debug, ai, project
Provide complete, working solutions with error handling.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...session.messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
      ];

      const response = await cod3x.llmFactory.chat(messages, {
        model: model || cod3x.config.ai.model,
        temperature: temperature || cod3x.config.ai.temperature,
        maxTokens: cod3x.config.ai.maxTokens,
      });

      session.messages.push({ role: 'assistant', content: response, timestamp: Date.now() });
      return { success: true, data: { response, type: 'chat' } };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMsg };
    }
  },

  // POST /api/tool/:name
  async executeTool(body, params) {
    if (!cod3x) return { success: false, error: 'Cod3x not initialized' };
    
    const { name } = params;
    const toolParams = body.params || body;

    try {
      // Set up tool context
      const context = {
        cwd: process.cwd(),
        permissions: {
          ask: async () => ({ granted: true, permanent: false }),
          check: async () => true,
        },
        logger: cod3x.logger,
        config: cod3x.config,
        platform: cod3x.platform,
        llm: cod3x.llmFactory.getPrimary(),
      };

      cod3x.toolRegistry.setContext(context);
      const result = await cod3x.toolRegistry.execute(name, toolParams);
      return { success: result.success, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  // POST /api/swarm
  async swarm(body) {
    if (!cod3x) return { success: false, error: 'Cod3x not initialized' };
    const { objective, context } = body;
    if (!objective) return { success: false, error: 'Objective is required' };

    const result = await cod3x.agentOrchestrator.executeSwarm(objective, context);
    return {
      success: result.success,
      data: {
        output: result.output,
        summary: result.summary,
        duration: result.duration,
        tokensUsed: result.tokensUsed,
      },
    };
  },

  // GET /api/config
  async getConfig() {
    if (!cod3x) return { success: false, error: 'Cod3x not initialized' };
    return {
      success: true,
      data: {
        name: cod3x.config.name,
        model: cod3x.config.ai.model,
        provider: cod3x.config.ai.provider,
        temperature: cod3x.config.ai.temperature,
        maxTokens: cod3x.config.ai.maxTokens,
        platform: cod3x.config.platform.type,
        swarm: cod3x.config.swarm,
        features: cod3x.config.features,
      },
    };
  },
};

// ─── HTTP Server ───
const server = http.createServer(async (req, res) => {
  requestCount++;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Static files
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML_UI);
    return;
  }

  // API routes
  if (pathname.startsWith('/api/')) {
    const route = pathname.slice(5); // Remove /api/
    
    try {
      let body = {};
      if (req.method === 'POST') {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const raw = Buffer.concat(chunks).toString();
        if (raw) body = JSON.parse(raw);
      }

      let result;
      switch (route) {
        case 'status':
          result = await apiHandlers.status();
          break;
        case 'tools':
          result = await apiHandlers.tools();
          break;
        case 'agents':
          result = await apiHandlers.agents();
          break;
        case 'chat':
          result = await apiHandlers.chat(body);
          break;
        case 'swarm':
          result = await apiHandlers.swarm(body);
          break;
        case 'config':
          result = await apiHandlers.getConfig();
          break;
        default:
          // Check for /api/tool/:name
          const toolMatch = route.match(/^tool\/(.+)$/);
          if (toolMatch) {
            result = await apiHandlers.executeTool(body, { name: toolMatch[1] });
          } else {
            result = { success: false, error: 'Not found' };
          }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }));
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'Not found' }));
});

// ─── HTML UI ───
const HTML_UI = await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8');

// ─── Start ───
async function main() {
  console.log('\n🔷 Cod3x Code v4.0 Web Server by CodexHaven');
  console.log('═══════════════════════════════════════════\n');

  const initialized = await initCod3x();
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌐 Web UI: http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`\nPress Ctrl+C to stop\n`);
  });
}

main().catch(console.error);
