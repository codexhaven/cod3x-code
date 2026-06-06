/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Tools Hook - Cod3x Code v4.0
 * Developed by CodexHaven
 * ═══════════════════════════════════════════════════════════════
 */
import { ToolRegistry, PermissionManager, Logger, Config, LLMProviderFactory, PlatformInfo } from '@codex-types/index';
interface UseToolsOptions {
    toolRegistry: ToolRegistry;
    permissions: PermissionManager;
    logger: Logger;
    config: Config;
    llmFactory: LLMProviderFactory;
    platform: PlatformInfo;
}
export declare function useTools({ toolRegistry, permissions, logger, config, llmFactory, platform }: UseToolsOptions): {
    executeTool: any;
    executingTools: any;
};
export default useTools;
//# sourceMappingURL=use-tools.d.ts.map