/**
 * ═══════════════════════════════════════════════════════════════
 * Debug Trail Hook - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Execution tracing and debugging trail system
 * ═══════════════════════════════════════════════════════════════
 */
import { Config, Logger, DebugTrail, TrailStep } from '@codex-types/index';
interface UseTrailOptions {
    config: Config;
    logger: Logger;
}
export declare function useTrail({ config, logger }: UseTrailOptions): {
    trail: DebugTrail;
    addStep: (type: TrailStep["type"], description: string, data?: Record<string, unknown>) => void;
    isRecording: boolean;
    startTrail: () => void;
    stopTrail: () => void;
    pauseTrail: () => void;
    exportTrail: () => string;
};
export default useTrail;
//# sourceMappingURL=use-trail.d.ts.map