import WebSocket from 'ws';
import { EventEmitter } from 'events';

export class MCPClient extends EventEmitter {
  constructor(serverUrl = 'ws://localhost:8765') {
    super();
    this.serverUrl = serverUrl;
    this.ws = null;
    this.tools = new Map();
    this.pendingCalls = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.serverUrl);
      
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
      
      this.ws.on('open', () => {
        clearTimeout(timeout);
        console.log('✓ Connected to MCP server');
        this.reconnectAttempts = 0;
        this.sendHandshake();
        resolve();
      });
      
      this.ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      
      this.ws.on('message', this.handleMessage.bind(this));
      this.ws.on('close', this.handleDisconnect.bind(this));
    });
  }
  
  sendHandshake() {
    this.send({
      type: 'handshake',
      client: 'Cod3x-Code',
      version: '1.0.0',
      capabilities: ['tools', 'prompts', 'resources']
    });
  }
  
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      
      switch(message.type) {
        case 'handshake_ack':
          console.log('✓ MCP handshake complete');
          break;
          
        case 'tools/list':
          for (const tool of message.tools) {
            this.tools.set(tool.name, tool);
          }
          this.emit('tools-ready', this.tools);
          console.log(`✓ Registered ${message.tools.length} MCP tools`);
          break;
          
        case 'tool/result':
          const pending = this.pendingCalls.get(message.id);
          if (pending) {
            clearTimeout(pending.timeout);
            this.pendingCalls.delete(message.id);
            pending.resolve(message.result);
          }
          break;
          
        case 'tool/error':
          const errorPending = this.pendingCalls.get(message.id);
          if (errorPending) {
            clearTimeout(errorPending.timeout);
            this.pendingCalls.delete(message.id);
            errorPending.reject(new Error(message.error));
          }
          break;
          
        default:
          this.emit('message', message);
      }
    } catch (error) {
      console.error('MCP message parse error:', error);
    }
  }
  
  handleDisconnect() {
    console.log('MCP server disconnected');
    this.emit('disconnected');
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    }
  }
  
  async callTool(name, params, timeout = 30000) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('MCP client not connected');
    }
    
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    
    const id = Math.random().toString(36).substring(2, 15);
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingCalls.delete(id);
        reject(new Error(`Tool call timeout after ${timeout}ms`));
      }, timeout);
      
      this.pendingCalls.set(id, { resolve, reject, timeout: timeoutId });
      
      this.send({
        type: 'tool/call',
        id: id,
        tool: name,
        params: params
      });
    });
  }
  
  async listTools() {
    return new Promise((resolve) => {
      if (this.tools.size > 0) {
        resolve(Array.from(this.tools.values()));
      } else {
        this.once('tools-ready', () => {
          resolve(Array.from(this.tools.values()));
        });
      }
    });
  }
  
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default MCPClient;
