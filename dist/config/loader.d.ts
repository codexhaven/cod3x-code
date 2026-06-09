/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Configuration Loader - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Three-level config with platform auto-detection and portable mode
 * Global -> Local -> Project hierarchy with environment overrides
 * Portable mode: all data stays in ./data/ relative to executable
 * ═══════════════════════════════════════════════════════════════
 */
import { Config } from '@codex-types/index';
export declare class ConfigLoader {
    private config;
    private loadedPaths;
    private platformDetector;
    private configHome;
    private dataHome;
    private portableRoot;
    constructor();
    /**
     * Detect portable mode by checking for data/ directory sibling to executable
     */
    private getPortableRoot;
    /**
     * Check if running in portable mode
     */
    isPortable(): boolean;
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
     * Save current configuration
     * - In portable mode: saves to data/config/
     * - In standard mode: saves to cwd
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
     * Initialize default configuration
     * - In portable mode: creates data/config/, data/memory/, data/logs/, data/tmp/
     * - In standard mode: creates .cod3x/ directory in cwd
     */
    init(cwd?: string): Promise<void>;
    private deepMerge;
    private deepClone;
}
export default ConfigLoader;
//# sourceMappingURL=loader.d.ts.map