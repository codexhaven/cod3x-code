import { MCPManager as IMCPManager, MCPConfig } from '@codex-types/index';
export declare class MCPManager implements IMCPManager {
    private config;
    private connected;
    constructor(config?: MCPConfig);
    connectAll(): Promise<void>;
    listServers(): Promise<void>;
    addServer(name: string, url: string): Promise<void>;
    removeServer(name: string): Promise<void>;
}
export default MCPManager;
//# sourceMappingURL=manager.d.ts.map