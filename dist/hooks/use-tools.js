/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Tools Hook - Cod3x Code v4.0
 * Developed by CodexHaven
 * ═══════════════════════════════════════════════════════════════
 */
import { useState, useCallback } from 'react';
export function useTools({ toolRegistry, permissions, logger, config, llmFactory, platform }) {
    const [executingTools, setExecutingTools] = useState([]);
    const executeTool = useCallback(async (name, params) => {
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
        }
        catch (error) {
            logger.error('Tool execution failed', { name, error: error.message });
            return { success: false, output: '', error: error.message };
        }
        finally {
            setExecutingTools((prev) => prev.filter((t) => t !== name));
        }
    }, [toolRegistry, permissions, logger, config, llmFactory, platform]);
    return { executeTool, executingTools };
}
export default useTools;
//# sourceMappingURL=use-tools.js.map