import { execSync } from 'child_process';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'decompress',
  description: 'Extract zip, tar, gz archives',
  category: 'utility',
  requiresApproval: true,
  parameters: [
    { name: 'source', type: 'string', description: 'Archive path', required: true },
    { name: 'output', type: 'string', description: 'Extract directory', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const source = params.source as string;
      const output = params.output ? `-C "${params.output}"` : '';
      let cmd = '';
      
      if (source.endsWith('.zip')) cmd = `unzip "${source}" ${output}`;
      else if (source.endsWith('.tar.gz') || source.endsWith('.tgz')) cmd = `tar -xzvf "${source}" ${output}`;
      else if (source.endsWith('.tar')) cmd = `tar -xvf "${source}" ${output}`;
      else return { success: false, output: '', error: 'Unknown archive format' };
      
      const output2 = execSync(cmd, { cwd: context.cwd, encoding: 'utf-8' }).trim();
      return { success: true, output: `Extracted: ${source}\n${output2}` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
