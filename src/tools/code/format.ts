import { ToolDefinition } from '@codex-types/index';
import { execSync } from 'child_process';

export const definition: ToolDefinition = {
  name: 'format_code',
  description: 'Format code using Prettier, Black, or gofmt',
  category: 'code',
  requiresApproval: true,
  parameters: [
    { name: 'path', type: 'string', description: 'Path to format', required: true },
    { name: 'formatter', type: 'string', description: 'prettier|black|gofmt|rustfmt', required: false },
    { name: 'check', type: 'boolean', description: 'Check only, no changes', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    const filePath = params.path as string;
    const check = params.check === true;
    let formatter = params.formatter as string | undefined;
    
    if (!formatter) {
      if (filePath.endsWith('.py')) formatter = 'black';
      else if (filePath.endsWith('.go')) formatter = 'gofmt';
      else if (filePath.endsWith('.rs')) formatter = 'rustfmt';
      else formatter = 'prettier';
    }
    
    try {
      let cmd = '';
      switch (formatter) {
        case 'prettier': cmd = `npx prettier "${filePath}"${check ? ' --check' : ' --write'}`; break;
        case 'black': cmd = `black ${check ? '--check ' : ''}"${filePath}"`; break;
        case 'gofmt': cmd = `gofmt ${check ? '-d' : '-w'} "${filePath}"`; break;
        case 'rustfmt': cmd = `rustfmt ${check ? '--check ' : ''}"${filePath}"`; break;
        default: return { success: false, output: '', error: `Unknown formatter: ${formatter}` };
      }
      
      const output = execSync(cmd, { cwd: context.cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
      return { success: true, output: output || `${formatter}: ${check ? 'Already formatted' : 'Formatted'}` };
    } catch (error: any) {
      return { success: false, output: error.stdout?.toString() || '', error: error.stderr?.toString() || error.message };
    }
  },
};
