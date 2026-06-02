import fs from 'fs/promises';
import path from 'path';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'notebook',
  description: 'Read and edit Jupyter notebook cells',
  category: 'utility',
  requiresApproval: true,
  parameters: [
    { name: 'path', type: 'string', description: 'Notebook path', required: true },
    { name: 'cell_index', type: 'number', description: 'Cell index', required: false },
    { name: 'content', type: 'string', description: 'New cell content', required: false },
    { name: 'operation', type: 'string', description: 'replace|insert|delete|add', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const notebookPath = path.resolve(context.cwd, params.path as string);
      const content = await fs.readFile(notebookPath, 'utf-8');
      const notebook = JSON.parse(content);
      
      if (notebook.cells) {
        return {
          success: true,
          output: `Notebook: ${params.path}\nCells: ${notebook.cells.length}\n${notebook.cells.map((c: any, i: number) => `  [${i}] ${c.cell_type}: ${c.source?.join('').slice(0, 50) || '...'}`).join('\n')}`,
          data: { cells: notebook.cells.length },
        };
      }
      
      return { success: true, output: `Notebook: ${params.path}\n${JSON.stringify(notebook, null, 2).slice(0, 2000)}` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
