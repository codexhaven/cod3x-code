import fs from 'fs/promises';
import path from 'path';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'extract_imports',
  description: 'Extract and analyze import/dependency statements from code',
  category: 'code',
  requiresApproval: false,
  parameters: [
    { name: 'path', type: 'string', description: 'File to analyze', required: true },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const content = await fs.readFile(path.resolve(context.cwd, params.path as string), 'utf-8');
      
      const imports: string[] = [];
      const patterns = [
        /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g,
        /import\s+['"]([^'"]+)['"]/g,
        /const\s+\w+\s+=\s+require\(['"]([^'"]+)['"]\)/g,
        /from\s+['"]([^'"]+)['"]/g,
        /use\s+['"]([^'"]+)['"]/g,
      ];
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          imports.push(match[1]);
        }
      }
      
      const unique = [...new Set(imports)];
      return {
        success: true,
        output: `Imports (${unique.length}):\n${unique.map(i => `  ${i}`).join('\n')}`,
        data: { imports: unique, count: unique.length },
      };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
