import fs from 'fs/promises';
import path from 'path';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'write_json',
  description: 'Write JSON files with pretty printing',
  category: 'filesystem',
  requiresApproval: true,
  parameters: [
    { name: 'path', type: 'string', description: 'File path', required: true },
    { name: 'data', type: 'object', description: 'JSON data', required: true },
    { name: 'pretty', type: 'boolean', description: 'Pretty print', required: false, default: true },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const target = path.resolve(context.cwd, params.path as string);
      const data = params.data;
      const json = JSON.stringify(data, null, params.pretty !== false ? 2 : undefined);
      
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, json, 'utf-8');
      
      return { success: true, output: `JSON written: ${params.path} (${json.length} bytes)` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
