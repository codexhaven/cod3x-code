import { ToolDefinition } from '@codex-types/index';
import { execSync } from 'child_process';

export const definition: ToolDefinition = {
  name: 'git_stash',
  description: 'Stash changes with message, pop, or list',
  category: 'git',
  requiresApproval: true,
  parameters: [
    { name: 'message', type: 'string', description: 'Stash message', required: false },
    { name: 'pop', type: 'boolean', description: 'Pop latest stash', required: false },
    { name: 'list', type: 'boolean', description: 'List stashes', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const cwd = context.cwd;
      const message = params.message as string | undefined;
      const pop = params.pop === true;
      const list = params.list === true;

      if (pop) {
        execSync('git stash pop', { cwd, encoding: 'utf-8' });
        return { success: true, output: 'Stash popped' };
      }
      if (list) {
        const output = execSync('git stash list', { cwd, encoding: 'utf-8' }).trim();
        return { success: true, output: output || 'No stashes' };
      }
      if (message) {
        execSync(`git stash push -m "${message}"`, { cwd, encoding: 'utf-8' });
        return { success: true, output: `Stashed: ${message}` };
      }

      execSync('git stash', { cwd, encoding: 'utf-8' });
      return { success: true, output: 'Changes stashed' };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
