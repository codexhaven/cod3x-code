import { ToolDefinition } from '@codex-types/index';
import { execSync } from 'child_process';

export const definition: ToolDefinition = {
  name: 'git_diff',
  description: 'Show differences between commits, branches, or working tree',
  category: 'git',
  requiresApproval: false,
  parameters: [
    { name: 'from', type: 'string', description: 'From commit/branch', required: false },
    { name: 'to', type: 'string', description: 'To commit/branch', required: false },
    { name: 'path', type: 'string', description: 'Specific file path', required: false },
    { name: 'stat', type: 'boolean', description: 'Show stat only', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const cwd = context.cwd;
      const from = params.from as string | undefined;
      const to = params.to as string | undefined;
      const filePath = params.path as string | undefined;
      const stat = params.stat === true;

      let cmd = 'git diff';
      if (from) cmd += ` ${from}`;
      if (to) cmd += ` ${to}`;
      if (stat) cmd += ' --stat';
      if (filePath) cmd += ` -- "${filePath}"`;

      const output = execSync(cmd, { cwd, encoding: 'utf-8' }).trim();
      return { success: true, output: output || 'No differences' };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
