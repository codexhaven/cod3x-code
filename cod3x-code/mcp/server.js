import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

export class MCPServer extends EventEmitter {
  constructor(port = 8765, options = {}) {
    super();
    this.port = port;
    this.wss = null;
    this.clients = new Map();
    this.tools = new Map();
    this.options = {
      authToken: null,
      maxClients: 10,
      ...options
    };
  }
  
  async start() {
    this.wss = new WebSocketServer({ port: this.port });
    
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      
      // Check auth if configured
      if (this.options.authToken) {
        const token = req.headers['authorization'];
        if (token !== `Bearer ${this.options.authToken}`) {
          ws.close(1008, 'Unauthorized');
          return;
        }
      }
      
      // Limit clients
      if (this.clients.size >= this.options.maxClients) {
        ws.close(1013, 'Too many clients');
        return;
      }
      
      const client = { id: clientId, ws, connectedAt: Date.now() };
      this.clients.set(clientId, client);
      
      console.log(`MCP client connected: ${clientId} (${this.clients.size} total)`);
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          await this.handleMessage(clientId, message);
        } catch (error) {
          console.error('Message handling error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        }
      });
      
      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`MCP client disconnected: ${clientId} (${this.clients.size} remaining)`);
        this.emit('client-disconnected', clientId);
      });
    });
    
    console.log(`🚀 MCP Server running on ws://localhost:${this.port}`);
    this.emit('started', { port: this.port });
  }
  
  async handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    switch(message.type) {
      case 'handshake':
        this.handleHandshake(clientId, message);
        break;
        
      case 'tool/call':
        await this.handleToolCall(clientId, message);
        break;
        
      case 'tools/list':
        this.sendToolsList(clientId);
        break;
        
      default:
        client.ws.send(JSON.stringify({
          type: 'error',
          id: message.id,
          error: `Unknown message type: ${message.type}`
        }));
    }
  }
  
  handleHandshake(clientId, message) {
    const client = this.clients.get(clientId);
    if (client) {
      client.clientInfo = {
        name: message.client,
        version: message.version,
        capabilities: message.capabilities || []
      };
      
      client.ws.send(JSON.stringify({
        type: 'handshake_ack',
        server: 'Cod3x-MCP',
        version: '1.0.0',
        capabilities: ['tools', 'prompts', 'resources']
      }));
      
      this.sendToolsList(clientId);
      this.emit('client-connected', clientId, client.clientInfo);
    }
  }
  
  async handleToolCall(clientId, message) {
    const client = this.clients.get(clientId);
    const tool = this.tools.get(message.tool);
    
    if (!tool) {
      client.ws.send(JSON.stringify({
        type: 'tool/error',
        id: message.id,
        error: `Unknown tool: ${message.tool}`
      }));
      return;
    }
    
    try {
      const result = await tool.handler(message.params);
      client.ws.send(JSON.stringify({
        type: 'tool/result',
        id: message.id,
        result: result
      }));
    } catch (error) {
      client.ws.send(JSON.stringify({
        type: 'tool/error',
        id: message.id,
        error: error.message
      }));
    }
  }
  
  sendToolsList(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      const toolsList = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        category: tool.category
      }));
      
      client.ws.send(JSON.stringify({
        type: 'tools/list',
        tools: toolsList
      }));
    }
  }
  
  registerTool(name, description, parameters, handler) {
    this.tools.set(name, {
      name,
      description,
      parameters,
      handler,
      category: 'custom',
      registeredAt: Date.now()
    });
    
    console.log(`✓ Registered tool: ${name}`);
    this.broadcastToolsList();
  }
  
  registerFileTools() {
    this.registerTool(
      'read_file',
      'Read contents of a file',
      [{ name: 'path', type: 'string', required: true }],
      async (params) => {
        const content = await fs.readFile(params.path, 'utf-8');
        return { success: true, content, path: params.path };
      }
    );
    
    this.registerTool(
      'write_file',
      'Write content to a file',
      [{ name: 'path', type: 'string', required: true }, { name: 'content', type: 'string', required: true }],
      async (params) => {
        await fs.writeFile(params.path, params.content, 'utf-8');
        return { success: true, path: params.path, size: params.content.length };
      }
    );
    
    this.registerTool(
      'execute_command',
      'Execute a shell command',
      [{ name: 'command', type: 'string', required: true }, { name: 'cwd', type: 'string' }],
      async (params) => {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        try {
          const { stdout, stderr } = await execAsync(params.command, { cwd: params.cwd || process.cwd() });
          return { success: true, stdout, stderr };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    );
  }
  
  broadcastToolsList() {
    const toolsList = Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
    
    for (const [clientId, client] of this.clients) {
      client.ws.send(JSON.stringify({
        type: 'tools/list',
        tools: toolsList
      }));
    }
  }
  
  broadcast(message) {
    const data = JSON.stringify(message);
    for (const [clientId, client] of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    }
  }
  
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
  
  stop() {
    if (this.wss) {
      this.wss.close();
      console.log('MCP Server stopped');
    }
  }
  
  getStats() {
    return {
      clients: this.clients.size,
      tools: this.tools.size,
      uptime: Date.now() - (this.startTime || Date.now()),
      port: this.port
    };
  }
}

export default MCPServer;
