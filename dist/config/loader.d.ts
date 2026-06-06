/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Configuration Loader - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Three-level config with platform auto-detection
 * Global → Local → Project hierarchy with environment overrides
 * ═══════════════════════════════════════════════════════════════
 */
import { Config } from '@codex-types/index';
export declare class ConfigLoader {
    private config;
    private loadedPaths;
    private platformDetector;
    constructor();
    /**
     * Load configuration from all levels with platform detection
     */
    load(cwd?: string): Promise<Config>;
    /**
     * Load configuration from a single file
     */
    private loadLevel;
    /**
     * Apply platform-specific defaults
     */
    private applyPlatformDefaults;
    /**
     * Apply environment variable overrides
     */
    private applyEnvironmentOverrides;
    /**
     * Deep merge partial config into current config
     */
    private mergeConfig;
    /**
     * Save current configuration to project level
     */
    save(cwd?: string): Promise<void>;
    /**
     * Get the current configuration
     */
    get(): Config;
    /**
     * Get list of loaded config paths
     */
    getLoadedPaths(): string[];
    /**
     * Initialize default configuration in current directory
     */
    init(cwd?: string): Promise<void>;
    private deepMerge;
    private deepClone;
}
export default ConfigLoader;
//# sourceMappingURL=loader.d.ts.map