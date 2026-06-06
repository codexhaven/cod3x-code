/**
 * ═══════════════════════════════════════════════════════════════
 * Cod3x Main App Component - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Enhanced React Ink terminal UI with swarm support,
 * browser integration, and debug trail visualization
 * ═══════════════════════════════════════════════════════════════
 */
import React from 'react';
import { Config, Logger, PermissionManager, ToolRegistry, ConversationMemory, MCPManager, AgentOrchestrator, LLMProviderFactory, PlatformInfo } from '@codex-types/index';
interface Cod3xAppProps {
    config: Config;
    logger: Logger;
    permissions: PermissionManager;
    toolRegistry: ToolRegistry;
    fileIndex: any;
    memory: ConversationMemory;
    mcpManager: MCPManager;
    agentOrchestrator: AgentOrchestrator;
    llmFactory: LLMProviderFactory;
    platform: PlatformInfo;
}
export declare const Cod3xApp: React.FC<Cod3xAppProps>;
export default Cod3xApp;
//# sourceMappingURL=app.d.ts.map