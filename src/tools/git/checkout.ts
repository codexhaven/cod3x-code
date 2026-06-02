import { ToolDefinition } from '@codex-types/index';
import { execSync } from 'child_process';

export const definition: ToolDefinition = {
  name: 'git_checkout',
  description: 'Switch branches or restore files',
  category: 'git',
  requiresApproval: true,
  parameters: [
    { name: 'branch', type: 'string', description: 'Branch to checkout', required: true },
    { name: 'create', type: 'boolean', description: 'Create new branch', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const cwd = context.cwd;
      const branch = params.branch as string;
      const create = params.create === true;

      const cmd = create ? `git checkout -b "${branch}"` : `git checkout "${branch}"`;
      execSync(cmd, { cwd, encoding: 'utf-8' });

      return { success: true, output: `Checked out: ${branch}${create ? ' (new)' : ''}` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
