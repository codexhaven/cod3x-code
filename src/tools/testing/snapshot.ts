import { execSync } from 'child_process';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'snapshot_test',
  description: 'Manage Jest/Vitest snapshots (update, remove, test)',
  category: 'testing',
  requiresApproval: true,
  parameters: [
    { name: 'action', type: 'string', description: 'update|remove|test', required: true },
    { name: 'pattern', type: 'string', description: 'Test file pattern', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const action = params.action as string;
      const pattern = params.pattern || '';
      
      let cmd = '';
      if (action === 'update') cmd = `npx jest ${pattern} -u`;
      else if (action === 'remove') cmd = `npx jest ${pattern} --updateSnapshot=false`;
      else cmd = `npx jest ${pattern}`;
      
      const output = execSync(cmd, { cwd: context.cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
      return { success: true, output };
    } catch (error: any) {
      return { success: false, output: error.stdout?.toString() || '', error: error.stderr?.toString() || error.message };
    }
  },
};
