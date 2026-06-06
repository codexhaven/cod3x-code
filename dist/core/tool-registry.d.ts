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
    constructor();
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