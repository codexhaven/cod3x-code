/**
 * ═══════════════════════════════════════════════════════════════
 * Debug Trail Hook - Cod3x Code v4.0
 * Developed by CodexHaven
 * 
 * Execution tracing and debugging trail system
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react';
import { Config, Logger, DebugTrail, TrailStep } from '@codex-types/index';

interface UseTrailOptions {
  config: Config;
  logger: Logger;
}

export function useTrail({ config, logger }: UseTrailOptions) {
  const [trail, setTrail] = useState<DebugTrail>({
    id: `trail-${Date.now()}`,
    steps: [],
    status: 'running',
    startTime: new Date(),
    totalDuration: 0,
  });
  const [isRecording, setIsRecording] = useState(config.debug.trailEnabled);

  const addStep = useCallback((
    type: TrailStep['type'],
    description: string,
    data?: Record<string, unknown>
  ) => {
    if (!isRecording) return;

    const step: TrailStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      timestamp: new Date(),
      description,
      input: data?.input,
      output: data?.output,
      duration: 0,
      success: (data?.success as boolean | undefined) ?? true,
    };

    setTrail(prev => ({
      ...prev,
      steps: [...prev.steps, step],
      totalDuration: Date.now() - prev.startTime.getTime(),
    }));

    logger.debug(`[Trail] ${type}: ${description}`, data);
  }, [isRecording, logger]);

  const startTrail = useCallback(() => {
    setIsRecording(true);
    setTrail({
      id: `trail-${Date.now()}`,
      steps: [],
      status: 'running',
      startTime: new Date(),
      totalDuration: 0,
    });
    logger.info('Debug trail started');
  }, [logger]);

  const stopTrail = useCallback(() => {
    setIsRecording(false);
    setTrail(prev => ({ ...prev, status: 'completed', endTime: new Date() }));
    logger.info('Debug trail stopped');
  }, [logger]);

  const pauseTrail = useCallback(() => {
    setTrail(prev => ({ ...prev, status: 'paused' }));
  }, []);

  const exportTrail = useCallback(() => {
    return JSON.stringify(trail, null, 2);
  }, [trail]);

  return { trail, addStep, isRecording, startTrail, stopTrail, pauseTrail, exportTrail };
}

export default useTrail;
