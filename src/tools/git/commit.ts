import { ToolDefinition } from '@codex-types/index';
import { execSync } from 'child_process';

export const definition: ToolDefinition = {
  name: 'git_commit',
  description: 'Stage and commit changes with a generated or provided message',
  category: 'git',
  requiresApproval: true,
  parameters: [
    { name: 'message', type: 'string', description: 'Commit message', required: true },
    { name: 'files', type: 'array', description: 'Specific files to commit', required: false },
    { name: 'amend', type: 'boolean', description: 'Amend previous commit', required: false },
    { name: 'all', type: 'boolean', description: 'Stage all changes', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const cwd = context.cwd;
      const message = params.message as string;
      const files = params.files as string[] | undefined;
      const amend = params.amend === true;
      const all = params.all === true;

      if (all) {
        execSync('git add -A', { cwd, encoding: 'utf-8' });
      } else if (files && files.length > 0) {
        for (const f of files) {
          execSync(`git add "${f}"`, { cwd, encoding: 'utf-8' });
        }
      }

      const amendFlag = amend ? ' --amend --no-edit' : '';
      execSync(`git commit -m "${message.replace(/"/g, '\\"')}"${amendFlag}`, { cwd, encoding: 'utf-8' });

      return {
        success: true,
        output: `Committed: ${message}${amend ? ' (amended)' : ''}`,
        data: { message, files: files || [], amend },
      };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
