import { ToolDefinition } from '@codex-types/index';
import { execSync } from 'child_process';

export const definition: ToolDefinition = {
  name: 'git_merge',
  description: 'Merge branches with conflict detection',
  category: 'git',
  requiresApproval: true,
  parameters: [
    { name: 'branch', type: 'string', description: 'Branch to merge', required: true },
    { name: 'noFastForward', type: 'boolean', description: 'Create merge commit', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const cwd = context.cwd;
      const branch = params.branch as string;
      const noFF = params.noFastForward === true;

      const cmd = `git merge ${noFF ? '--no-ff ' : ''}"${branch}"`;
      execSync(cmd, { cwd, encoding: 'utf-8' });

      return { success: true, output: `Merged: ${branch}` };
    } catch (error: any) {
      const hasConflicts = error.message?.includes('CONFLICT');
      return { success: false, output: '', error: hasConflicts ? `Merge conflicts! Resolve manually. ${error.message}` : error.message };
    }
  },
};
