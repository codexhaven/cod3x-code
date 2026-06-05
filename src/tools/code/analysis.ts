import fs from 'fs/promises';
import path from 'path';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'analyze_code',
  description: 'Analyze code complexity, dependencies, and quality metrics',
  category: 'code',
  requiresApproval: false,
  parameters: [
    { name: 'path', type: 'string', description: 'File or directory to analyze', required: true },
    { name: 'type', type: 'string', description: 'complexity|dependencies|security|style|full', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    const filePath = params.path as string;
    const type = (params.type as string) || 'full';

    try {
      const absolutePath = path.resolve(context.cwd, filePath);
      const stats = await fs.stat(absolutePath);
      
      if (stats.isDirectory()) {
        return { success: true, output: `Directory analysis: ${filePath} contains multiple files. Use analyze on individual files for detailed metrics.` };
      }

      const content = await fs.readFile(absolutePath, 'utf-8');
      const lines = content.split('\n');
      
      let output = `Analysis of ${filePath}:\n`;
      output += `  Lines: ${lines.length}\n`;
      output += `  Size: ${content.length} bytes\n`;
      output += `  Functions: ${(content.match(/function\s+\w+/g) || []).length}\n`;
      output += `  Classes: ${(content.match(/class\s+\w+/g) || []).length}\n`;
      output += `  Imports: ${(content.match(/^(import|require|from)/gm) || []).length}\n`;
      output += `  TODOs: ${(content.match(/TODO|FIXME|HACK/gi) || []).length}\n`;
      output += `  Comments: ${(content.match(/\/\/|\/\*|#/g) || []).length}\n`;

      if (type === 'complexity' || type === 'full') {
        const cyclomatic = (content.match(/if|while|for|switch|catch|\?\./g) || []).length;
        output += `  Cyclomatic complexity: ${cyclomatic}\n`;
      }

      return { success: true, output, data: { lines: lines.length, size: content.length } };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
