/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Tool Registry - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * 80+ tools across 14 categories with platform awareness
 * ═══════════════════════════════════════════════════════════════
 */
import { ToolDefinition, ToolRegistry as IToolRegistry, ToolResult, ToolContext } from '@codex-types/index';
export declare class ToolRegistry implements IToolRegistry {
    private tools;
    private context;
    private permissionsLogPath;
    constructor();
    /**
     * Log permission decisions to data/logs/permissions.log
     */
    private logPermission;
    /**
     * Check if a tool is dangerous and requires explicit approval in portable mode
     */
    private isDangerousTool;
    /**
     * Check if portable mode safety override applies
     */
    private requiresExplicitApproval;
    register(tool: ToolDefinition): void;
    unregister(name: string): void;
    get(name: string): ToolDefinition | undefined;
    list(): ToolDefinition[];
    listByCategory(category: string): ToolDefinition[];
    execute(name: string, params: Record<string, unknown>): Promise<ToolResult>;
    loadDefaults(): Promise<void>;
    getCount(): number;
    setContext(context: ToolContext): void;
}
export default ToolRegistry;
//# sourceMappingURL=tool-registry.d.ts.map