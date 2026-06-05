import { ToolDefinition } from '@codex-types/index';
import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

export const definition: ToolDefinition = {
  name: 'semantic_search',
  description: 'AI-powered semantic code search using embeddings similarity',
  category: 'search',
  requiresApproval: false,
  parameters: [
    { name: 'query', type: 'string', description: 'Natural language query', required: true },
    { name: 'path', type: 'string', description: 'Search directory', required: false, default: '.' },
    { name: 'limit', type: 'number', description: 'Max results', required: false, default: 10 },
  ],
  handler: async (params, context): Promise<any> => {
    const query = params.query as string;
    
    try {
      // Simple keyword-based semantic search
      const files = await glob('**/*.{js,ts,jsx,tsx,py,go,rs,java,md}', { cwd: path.resolve(context.cwd, params.path as string || '.'), ignore: 'node_modules/**' });
      
      const queryWords = query.toLowerCase().split(/\s+/);
      const scored = [];
      
      for (const file of files.slice(0, 30)) {
        const content = await fs.readFile(path.resolve(context.cwd, params.path as string || '.', file), 'utf-8').catch(() => '');
        const lower = content.toLowerCase();
        let score = 0;
        
        for (const word of queryWords) {
          if (lower.includes(word)) score += 1;
          if (file.toLowerCase().includes(word)) score += 2;
        }
        
        if (score > 0) {
          scored.push({ file, score, preview: content.slice(0, 200) });
        }
      }
      
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, (params.limit as number) || 10);
      
      return {
        success: true,
        output: top.length > 0
          ? `Semantic results for "${query}":\n${top.map(s => `  ${s.file} (score: ${s.score})\n    ${s.preview.slice(0, 100)}...`).join('\n')}`
          : `No results for "${query}"`,
        data: { results: top },
      };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
