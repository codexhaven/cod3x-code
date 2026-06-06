/**
 * ═══════════════════════════════════════════════════════════════
 * Debug Trail Hook - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Execution tracing and debugging trail system
 * ═══════════════════════════════════════════════════════════════
 */
import { Config, Logger } from '@codex-types/index';
interface UseTrailOptions {
    config: Config;
    logger: Logger;
}
export declare function useTrail({ config, logger }: UseTrailOptions): {
    trail: any;
    addStep: any;
    isRecording: any;
    startTrail: any;
    stopTrail: any;
    pauseTrail: any;
    exportTrail: any;
};
export default useTrail;
//# sourceMappingURL=use-trail.d.ts.map