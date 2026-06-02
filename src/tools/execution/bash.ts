/**
 * ═══════════════════════════════════════════════════════════════
 * Bash Tool - Cod3x Code v4.0 by CodexHaven
 * ═══════════════════════════════════════════════════════════════
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolDefinition, ToolResult, ToolContext } from '@codex-types/index';

const execAsync = promisify(exec);

export const definition: ToolDefinition = {
  name: 'bash',
  description: 'Execute shell commands with security controls, timeout, and environment variables.',
  category: 'execution',
  requiresApproval: true,
  parameters: [
    { name: 'command', type: 'string', description: 'Shell command to execute', required: true },
    { name: 'cwd', type: 'string', description: 'Working directory', required: false },
    { name: 'timeout', type: 'number', description: 'Timeout in milliseconds', required: false, default: 30000 },
    { name: 'env', type: 'object', description: 'Environment variables', required: false },
  ],
  handler: async (params, context): Promise<ToolResult> => {
    const command = params.command as string;
    const cwd = params.cwd ? params.cwd as string : context.cwd;
    const timeout = (params.timeout as number) || 30000;
    const env = params.env as Record<string, string> | undefined;

    // Security checks
    for (const blocked of context.config.permissions.blockedCommands) {
      if (command.includes(blocked)) {
        return { success: false, output: '', error: `Blocked command: "${blocked}" is not allowed` };
      }
    }

    for (const pattern of context.config.permissions.autoDenyPatterns) {
      if (new RegExp(pattern).test(command)) {
        return { success: false, output: '', error: `Auto-denied by pattern: ${pattern}` };
      }
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        env: env ? { ...process.env, ...env } : process.env,
        maxBuffer: context.config.limits.maxOutputSize,
      });

      const output = stdout || stderr || '(no output)';
      return {
        success: true,
        output: output.slice(0, context.config.limits.maxOutputSize),
        data: { command, cwd, exitCode: 0 },
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout?.slice(0, context.config.limits.maxOutputSize) || '',
        error: error.stderr?.slice(0, 2000) || error.message,
        exitCode: error.code || 1,
      };
    }
  },
};

export default definition;
