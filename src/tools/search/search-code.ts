import { execSync } from 'child_process';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'search_code',
  description: 'Semantic code search with context and filtering',
  category: 'search',
  requiresApproval: false,
  parameters: [
    { name: 'query', type: 'string', description: 'Search query', required: true },
    { name: 'language', type: 'string', description: 'Filter by language', required: false },
    { name: 'limit', type: 'number', description: 'Max results', required: false, default: 20 },
  ],
  handler: async (params, context): Promise<any> => {
    const query = params.query as string;
    const language = params.language as string | undefined;
    const limit = (params.limit as number) || 20;
    
    try {
      const langFlag = language ? `--include="*.${language}"` : '';
      const cmd = `grep -r -n ${langFlag} -C 2 --include="*.*" -m ${limit} "${query}" "${context.cwd}" 2>/dev/null || true`;
      const output = execSync(cmd, { cwd: context.cwd, encoding: 'utf-8', maxBuffer: 1024 * 1024 }).trim();
      
      return {
        success: true,
        output: output || `No results for "${query}"`,
        data: { query, matches: output ? output.split('\n').filter(l => l.match(/^[^:]+:\d+:/)).length : 0 },
      };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
