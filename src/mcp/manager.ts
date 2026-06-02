import { MCPManager as IMCPManager, MCPConfig, MCPServerConfig } from '@codex-types/index';

export class MCPManager implements IMCPManager {
  private config: MCPConfig;
  private connected: Map<string, any> = new Map();

  constructor(config?: MCPConfig) {
    this.config = config || { enabled: false, port: 8765, host: 'localhost', autoStart: false, servers: [] };
  }

  async connectAll(): Promise<void> {
    for (const server of this.config.servers) {
      try {
        this.connected.set(server.name, { status: 'connected', url: server.url });
      } catch (error: any) {
        console.error(`MCP server ${server.name} failed:`, error.message);
      }
    }
  }

  async listServers(): Promise<void> {
    console.log('MCP Servers:');
    for (const [name, info] of this.connected) {
      console.log(`  ${name}: ${(info as any).status}`);
    }
    if (this.connected.size === 0) console.log('  No MCP servers connected');
  }

  async addServer(name: string, url: string): Promise<void> {
    this.config.servers.push({ name, url, tools: [] });
    console.log(`Added MCP server: ${name} (${url})`);
  }

  async removeServer(name: string): Promise<void> {
    this.connected.delete(name);
    this.config.servers = this.config.servers.filter(s => s.name !== name);
    console.log(`Removed MCP server: ${name}`);
  }
}

export default MCPManager;
