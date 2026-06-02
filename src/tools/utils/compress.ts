import { execSync } from 'child_process';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'compress',
  description: 'Compress files using zip, tar, or gz',
  category: 'utility',
  requiresApproval: true,
  parameters: [
    { name: 'source', type: 'string', description: 'Source path', required: true },
    { name: 'output', type: 'string', description: 'Output archive', required: true },
    { name: 'format', type: 'string', description: 'zip|tar|gz', required: false, default: 'zip' },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const format = (params.format as string) || 'zip';
      let cmd = '';
      
      switch (format) {
        case 'zip': cmd = `zip -r "${params.output}" "${params.source}"`; break;
        case 'tar': cmd = `tar -cvf "${params.output}" "${params.source}"`; break;
        case 'gz': cmd = `tar -czvf "${params.output}" "${params.source}"`; break;
        default: return { success: false, output: '', error: `Unknown format: ${format}` };
      }
      
      const output = execSync(cmd, { cwd: context.cwd, encoding: 'utf-8' }).trim();
      return { success: true, output: `Compressed: ${params.output}\n${output}` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
