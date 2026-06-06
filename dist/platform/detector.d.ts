/**
 * ═══════════════════════════════════════════════════════════════
 * Platform Detector - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Auto-detects platform: Termux (default), Linux, Windows, macOS, Android
 * Provides platform-specific adaptations for maximum compatibility
 * ═══════════════════════════════════════════════════════════════
 */
import { PlatformInfo } from '@codex-types/index';
export declare class PlatformDetector {
    private static instance;
    private cachedInfo?;
    static getInstance(): PlatformDetector;
    /**
     * Detect the current platform with comprehensive checks
     */
    detect(): Promise<PlatformInfo>;
    /**
     * Check if running in Termux environment
     */
    private checkTermux;
    /**
     * Detect the appropriate shell for the platform
     */
    private detectShell;
    /**
     * Get the home directory for the platform
     */
    private getHomeDir;
    /**
     * Get the temp directory for the platform
     */
    private getTempDir;
    /**
     * Get platform-specific command adaptations
     */
    getCommandAdaptations(info: PlatformInfo): {
        pathSeparator: string;
        lineEnding: string;
        shebang: string;
        nodePath: string;
        npmPath: string;
        pythonPath: string;
    };
    /**
     * Get platform-specific installation instructions
     */
    getInstallInstructions(info: PlatformInfo): string;
    /**
     * Apply platform-specific environment adjustments
     */
    applyEnvironment(info: PlatformInfo): void;
}
export default PlatformDetector;
//# sourceMappingURL=detector.d.ts.map