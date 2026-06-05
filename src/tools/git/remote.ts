import { ToolDefinition } from '@codex-types/index';
import { execSync } from 'child_process';

export const definition: ToolDefinition = {
  name: 'git_remote',
  description: 'Manage remote repositories',
  category: 'git',
  requiresApproval: false,
  parameters: [
    { name: 'action', type: 'string', description: 'add|remove|show|set-url', required: false },
    { name: 'name', type: 'string', description: 'Remote name', required: false },
    { name: 'url', type: 'string', description: 'Remote URL', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const cwd = context.cwd;
      const action = params.action as string | undefined;
      const name = params.name as string | undefined;
      const url = params.url as string | undefined;

      if (action === 'add' && name && url) {
        execSync(`git remote add "${name}" "${url}"`, { cwd, encoding: 'utf-8' });
        return { success: true, output: `Added remote: ${name} -> ${url}` };
      }
      if (action === 'remove' && name) {
        execSync(`git remote remove "${name}"`, { cwd, encoding: 'utf-8' });
        return { success: true, output: `Removed remote: ${name}` };
      }
      if (action === 'set-url' && name && url) {
        execSync(`git remote set-url "${name}" "${url}"`, { cwd, encoding: 'utf-8' });
        return { success: true, output: `Updated remote: ${name} -> ${url}` };
      }

      const output = execSync('git remote -v', { cwd, encoding: 'utf-8' }).trim();
      return { success: true, output: output || 'No remotes configured' };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
