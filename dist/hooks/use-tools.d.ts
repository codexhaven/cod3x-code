/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Tools Hook - Cod3x Code v4.0
 * Developed by CodexHaven
 * ═══════════════════════════════════════════════════════════════
 */
import { ToolRegistry, PermissionManager, Logger, Config, ToolResult, LLMProviderFactory, PlatformInfo } from '@codex-types/index';
interface UseToolsOptions {
    toolRegistry: ToolRegistry;
    permissions: PermissionManager;
    logger: Logger;
    config: Config;
    llmFactory: LLMProviderFactory;
    platform: PlatformInfo;
}
export declare function useTools({ toolRegistry, permissions, logger, config, llmFactory, platform }: UseToolsOptions): {
    executeTool: (name: string, params: Record<string, unknown>) => Promise<ToolResult>;
    executingTools: string[];
};
export default useTools;
//# sourceMappingURL=use-tools.d.ts.map