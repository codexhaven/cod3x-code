import fs from 'fs/promises';
import path from 'path';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'remove_file',
  description: 'Remove files or directories with confirmation',
  category: 'filesystem',
  requiresApproval: true,
  parameters: [
    { name: 'path', type: 'string', description: 'Path to remove', required: true },
    { name: 'recursive', type: 'boolean', description: 'Remove directories', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const target = path.resolve(context.cwd, params.path as string);
      const stats = await fs.stat(target);
      
      if (stats.isDirectory() && params.recursive) {
        await fs.rm(target, { recursive: true });
      } else {
        await fs.unlink(target);
      }
      
      return { success: true, output: `Removed: ${params.path}` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
