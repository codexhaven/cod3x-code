import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'find_dead_code',
  description: 'Find unused exports, functions, and variables',
  category: 'code',
  requiresApproval: false,
  parameters: [
    { name: 'path', type: 'string', description: 'Directory to scan', required: false, default: '.' },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const searchPath = (params.path as string) || '.';
      const files = await glob('**/*.{js,ts,jsx,tsx}', { cwd: path.resolve(context.cwd, searchPath), ignore: 'node_modules/**' });
      
      const exports: Map<string, Set<string>> = new Map();
      const imports: Set<string> = new Set();
      
      for (const file of files.slice(0, 50)) {
        const content = await fs.readFile(path.resolve(context.cwd, searchPath, file), 'utf-8');
        
        // Find exports
        const exportMatches = content.match(/export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)?\s*(\w+)/g);
        if (exportMatches) {
          if (!exports.has(file)) exports.set(file, new Set());
          for (const m of exportMatches) {
            const name = m.match(/(\w+)$/)?.[1];
            if (name) exports.get(file)!.add(name);
          }
        }
        
        // Find imports (what's being used from other files)
        const importMatches = content.match(/from\s+['"]\.\/[^'"]+['"]/g);
        if (importMatches) {
          for (const m of importMatches) imports.add(m);
        }
      }
      
      let output = 'Dead code analysis:\n';
      let totalUnused = 0;
      
      for (const [file, fileExports] of exports) {
        const fileImports = [...imports].filter(i => i.includes(file.replace(/\.[^.]+$/, '')));
        if (fileImports.length === 0 && fileExports.size > 0) {
          output += `\n${file}: Possibly unused exports: ${[...fileExports].join(', ')}\n`;
          totalUnused += fileExports.size;
        }
      }
      
      return {
        success: true,
        output: totalUnused > 0 ? output : 'No obvious dead code detected.',
        data: { totalUnused },
      };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
