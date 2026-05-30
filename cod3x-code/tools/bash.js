import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function execute(params) {
  const { command, cwd = process.cwd(), timeout = 30000, needApproval = 'true' } = params;
  
  // Security: Block dangerous commands
  const blockedPatterns = [
    /rm\s+(-rf?|--recursive)\s+[\/~]/i,
    /sudo\s+/i,
    /chmod\s+777\s+/i,
    /dd\s+if=/i,
    />\s*\/dev\/sd/i,
    /mkfs/i,
    /:\(\)\s*\{\s*:\|:&\s*\};:/,
    /del\s+\/f/i,
    /format\s+[c-z]:/i
  ];
  
  for (const pattern of blockedPatterns) {
    if (pattern.test(command)) {
      return { 
        success: false, 
        error: `Security: Blocked dangerous command pattern`,
        command: command.slice(0, 100)
      };
    }
  }
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: cwd,
      timeout: timeout,
      maxBuffer: 10 * 1024 * 1024,
      shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash',
      env: {
        ...process.env,
        PATH: process.env.PATH,
        HOME: process.env.HOME
      }
    });
    
    const output = (stdout + stderr).trim();
    
    return {
      success: true,
      output: output.slice(0, 10000),
      fullOutput: output,
      exitCode: 0,
      command: command
    };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message,
      exitCode: error.code || 1,
      command: command
    };
  }
}

export function validate(params) {
  if (!params.command) {
    return { valid: false, error: 'Missing required parameter: command' };
  }
  return { valid: true };
}

export const metadata = {
  name: 'bash',
  description: 'Execute shell commands with security controls',
  parameters: ['command', 'cwd', 'timeout', 'needApproval'],
  requiresApproval: true,
  category: 'execution'
};
