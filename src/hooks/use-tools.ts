/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Tools Hook - Cod3x Code v4.0
 * Developed by CodexHaven
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react';
import { ToolRegistry, PermissionManager, Logger, Config, ToolResult, LLMProviderFactory, PlatformInfo } from '@codex-types/index';

interface UseToolsOptions {
  toolRegistry: ToolRegistry;
  permissions: PermissionManager;
  logger: Logger;
  config: Config;
  llmFactory: LLMProviderFactory;
  platform: PlatformInfo;
}

export function useTools({ toolRegistry, permissions, logger, config, llmFactory, platform }: UseToolsOptions) {
  const [executingTools, setExecutingTools] = useState<string[]>([]);

  const executeTool = useCallback(async (name: string, params: Record<string, unknown>): Promise<ToolResult> => {
    setExecutingTools((prev) => [...prev, name]);
    logger.debug('Executing tool', { name, params });
    
    const startTime = Date.now();
    
    try {
      // Set up tool context with all dependencies
      const context = {
        cwd: process.cwd(),
        permissions,
        logger,
        config,
        platform,
        llm: llmFactory.getPrimary(),
      };

      toolRegistry.setContext(context);
      const result = await toolRegistry.execute(name, params);
      
      logger.logToolCall(name, params, Date.now() - startTime, result.success);
      return result;
    } catch (error) {
      logger.error('Tool execution failed', { name, error: (error as Error).message });
      return { success: false, output: '', error: (error as Error).message };
    } finally {
      setExecutingTools((prev) => prev.filter((t) => t !== name));
    }
  }, [toolRegistry, permissions, logger, config, llmFactory, platform]);

  return { executeTool, executingTools };
}

export default useTools;
