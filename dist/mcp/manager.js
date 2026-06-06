export class MCPManager {
    config;
    connected = new Map();
    constructor(config) {
        this.config = config || { enabled: false, port: 8765, host: 'localhost', autoStart: false, servers: [] };
    }
    async connectAll() {
        for (const server of this.config.servers) {
            try {
                this.connected.set(server.name, { status: 'connected', url: server.url });
            }
            catch (error) {
                console.error(`MCP server ${server.name} failed:`, error.message);
            }
        }
    }
    async listServers() {
        console.log('MCP Servers:');
        for (const [name, info] of this.connected) {
            console.log(`  ${name}: ${info.status}`);
        }
        if (this.connected.size === 0)
            console.log('  No MCP servers connected');
    }
    async addServer(name, url) {
        this.config.servers.push({ name, url, tools: [] });
        console.log(`Added MCP server: ${name} (${url})`);
    }
    async removeServer(name) {
        this.connected.delete(name);
        this.config.servers = this.config.servers.filter(s => s.name !== name);
        console.log(`Removed MCP server: ${name}`);
    }
}
export default MCPManager;
//# sourceMappingURL=manager.js.map