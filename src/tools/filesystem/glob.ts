import { glob } from 'glob';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'glob_search',
  description: 'Search files using glob patterns with ignore support',
  category: 'filesystem',
  requiresApproval: false,
  parameters: [
    { name: 'pattern', type: 'string', description: 'Glob pattern', required: true },
    { name: 'ignore', type: 'string', description: 'Ignore pattern', required: false },
    { name: 'limit', type: 'number', description: 'Max results', required: false, default: 100 },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const files = await glob(params.pattern as string, {
        cwd: context.cwd,
        ignore: params.ignore as string | undefined,
        nodir: true,
        absolute: false,
      });
      
      const limited = files.slice(0, (params.limit as number) || 100);
      return {
        success: true,
        output: `Found ${files.length} files:\n${limited.join('\n')}${files.length > limited.length ? '\n...' : ''}`,
        data: { count: files.length, files: limited },
      };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
