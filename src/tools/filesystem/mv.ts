import fs from 'fs/promises';
import path from 'path';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'move_file',
  description: 'Move or rename files',
  category: 'filesystem',
  requiresApproval: true,
  parameters: [
    { name: 'source', type: 'string', description: 'Source path', required: true },
    { name: 'destination', type: 'string', description: 'Destination path', required: true },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const src = path.resolve(context.cwd, params.source as string);
      const dest = path.resolve(context.cwd, params.destination as string);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.rename(src, dest);
      return { success: true, output: `Moved: ${params.source} -> ${params.destination}` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
