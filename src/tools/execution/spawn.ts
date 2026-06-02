/**
 * ═══════════════════════════════════════════════════════════════
 * Spawn Tool - Cod3x Code v4.0 by CodexHaven
 * ═══════════════════════════════════════════════════════════════
 */

import { spawn } from 'child_process';
import { ToolDefinition, ToolResult, ToolContext } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'spawn',
  description: 'Spawn processes with streaming output and fine-grained control.',
  category: 'execution',
  requiresApproval: true,
  parameters: [
    { name: 'command', type: 'string', description: 'Command to spawn', required: true },
    { name: 'args', type: 'array', description: 'Command arguments', required: false },
    { name: 'cwd', type: 'string', description: 'Working directory', required: false },
    { name: 'timeout', type: 'number', description: 'Timeout in ms', required: false, default: 60000 },
    { name: 'env', type: 'object', description: 'Environment variables', required: false },
  ],
  handler: async (params, context): Promise<ToolResult> => {
    const command = params.command as string;
    const args = (params.args as string[]) || [];
    const cwd = (params.cwd as string) || context.cwd;
    const timeout = (params.timeout as number) || 60000;
    const env = params.env as Record<string, string> | undefined;

    for (const blocked of context.config.permissions.blockedCommands) {
      if (command.includes(blocked)) {
        return { success: false, output: '', error: `Blocked: ${blocked}` };
      }
    }

    return new Promise((resolve) => {
      const proc = spawn(command, args, {
        cwd,
        env: env ? { ...process.env, ...env } : process.env,
        shell: true,
      });

      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        proc.kill('SIGTERM');
        resolve({ success: false, output: stdout, error: `Timeout after ${timeout}ms`, exitCode: -1 });
      }, timeout);

      proc.stdout?.on('data', (data) => { stdout += data.toString(); });
      proc.stderr?.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        clearTimeout(timer);
        const output = stdout || stderr || '(no output)';
        resolve({
          success: code === 0,
          output: output.slice(0, context.config.limits.maxOutputSize),
          error: code !== 0 ? stderr.slice(0, 2000) : undefined,
          exitCode: code || 0,
        });
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        resolve({ success: false, output: stdout, error: err.message });
      });
    });
  },
};

export default definition;
