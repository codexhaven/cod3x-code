/**
 * ═══════════════════════════════════════════════════════════════
 * Cross-Platform Bash Tool - Cod3x Code v4.0 by CodexHaven
 * 
 * Executes shell commands with platform awareness:
 * - Linux/macOS: bash/sh
 * - Windows: cmd.exe / PowerShell
 * - Termux: bash with PATH fixes
 * ═══════════════════════════════════════════════════════════════
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolDefinition, ToolResult, ToolContext } from '@codex-types/index';

const execAsync = promisify(exec);

export const definition: ToolDefinition = {
  name: 'bash',
  description: 'Execute shell commands with security controls, timeout, and cross-platform support. Automatically adapts to bash (Unix), cmd/PowerShell (Windows), and Termux.',
  category: 'execution',
  requiresApproval: true,
  parameters: [
    { name: 'command', type: 'string', description: 'Shell command to execute', required: true },
    { name: 'cwd', type: 'string', description: 'Working directory', required: false },
    { name: 'timeout', type: 'number', description: 'Timeout in milliseconds', required: false, default: 30000 },
    { name: 'env', type: 'object', description: 'Environment variables', required: false },
  ],
  handler: async (params, context): Promise<ToolResult> => {
    let command = params.command as string;
    const cwd = params.cwd ? params.cwd as string : context.cwd;
    const timeout = (params.timeout as number) || 30000;
    const env = params.env as Record<string, string> | undefined;

    // Platform-specific command adaptation
    const platform = context.platform;
    
    if (platform.isWindows) {
      // Convert common Unix commands to Windows equivalents
      const unixToWin: Record<string, string> = {
        'ls ': 'dir /B ',
        'ls -': 'dir ',
        'cat ': 'type ',
        'cp ': 'copy ',
        'cp -r': 'xcopy /E /I',
        'mv ': 'move ',
        'rm ': 'del ',
        'rm -rf': 'rmdir /S /Q',
        'mkdir -p': 'mkdir',
        'touch ': 'type nul > ',
        'grep ': 'findstr ',
        'pwd': 'cd',
        'clear': 'cls',
        'which ': 'where ',
      };
      
      for (const [unix, win] of Object.entries(unixToWin)) {
        if (command.startsWith(unix)) {
          command = win + command.slice(unix.length);
          break;
        }
      }
      
      // Replace forward slashes in paths (but not in URLs or flags)
      command = command.replace(/(?<!\w:\/\/[^\s]*)\/(?!\w+\/\/)/g, (match, offset, str) => {
        // Don't replace if part of a URL scheme or flag
        if (str.slice(offset - 10, offset).includes('://') || 
            (offset > 0 && str[offset - 1] === '-')) {
          return match;
        }
        return '\\';
      });
    }

    if (platform.isTermux) {
      // Ensure Termux PATH is set
      const termuxPrefix = process.env.PREFIX || '/data/data/com.termux/files/usr';
      const termuxPath = `${termuxPrefix}/bin:${termuxPrefix}/local/bin`;
      
      // Prepend common Termux paths if not present
      if (!command.includes('export PATH=') && process.env.PATH && !process.env.PATH.includes(termuxPrefix)) {
        command = `export PATH="${termuxPath}:$PATH" && ${command}`;
      }
    }

    // Security checks
    for (const blocked of context.config.permissions.blockedCommands) {
      if (command.toLowerCase().includes(blocked.toLowerCase())) {
        return { success: false, output: '', error: `Blocked command: "${blocked}" is not allowed` };
      }
    }

    for (const pattern of context.config.permissions.autoDenyPatterns) {
      try {
        if (new RegExp(pattern, 'i').test(command)) {
          return { success: false, output: '', error: `Auto-denied by pattern: ${pattern}` };
        }
      } catch {
        // Invalid regex, skip
      }
    }

    // Determine shell
    const shell = platform.isWindows ? (process.env.COMSPEC || 'cmd.exe') : (platform.shell || '/bin/bash');

    try {
      const execOptions: any = {
        cwd,
        timeout,
        env: env ? { ...process.env, ...env } : process.env,
        maxBuffer: context.config.limits.maxOutputSize,
        shell,
        windowsHide: platform.isWindows,
      };

      const { stdout, stderr } = await execAsync(command, execOptions);

      const output = (stdout || stderr || "(no output)").toString();
      return {
        success: true,
        output: output.slice(0, context.config.limits.maxOutputSize),
        data: { command, cwd, exitCode: 0, shell: platform.isWindows ? 'cmd' : 'bash' },
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout?.toString().slice(0, context.config.limits.maxOutputSize) || '',
        error: error.stderr?.slice(0, 2000) || error.message,
        exitCode: error.code || 1,
        data: { command, cwd, shell: platform.isWindows ? 'cmd' : 'bash' },
      };
    }
  },
};

export default definition;
