import fs from 'fs/promises';
import path from 'path';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'readme_generator',
  description: 'Generate comprehensive README.md for the project',
  category: 'documentation',
  requiresApproval: true,
  parameters: [
    { name: 'path', type: 'string', description: 'Project path', required: false, default: '.' },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const files = await fs.readdir(path.resolve(context.cwd, params.path as string || '.'));
      const hasPackageJson = files.includes('package.json');
      const hasPyproject = files.includes('pyproject.toml');
      const hasCargo = files.includes('Cargo.toml');
      const hasGoMod = files.includes('go.mod');
      
      let projectInfo = 'Project';
      try {
        if (hasPackageJson) {
          const pkg = JSON.parse(await fs.readFile(path.join(context.cwd, 'package.json'), 'utf-8'));
          projectInfo = `${pkg.name || 'Project'}\nDescription: ${pkg.description || 'N/A'}\nVersion: ${pkg.version || 'N/A'}`;
        }
      } catch { /* ignore */ }
      
      const prompt = `Generate a professional README.md for this project:\n${projectInfo}\nFiles: ${files.join(', ')}\nHas package.json: ${hasPackageJson}\nHas Python: ${hasPyproject}\nHas Rust: ${hasCargo}\nHas Go: ${hasGoMod}\n\nInclude installation, usage, and contribution sections. Mention Cod3x by CodexHaven.`;

      const response = await context.llm.chat([
        { role: 'system', content: 'Generate professional README files.' },
        { role: 'user', content: prompt },
      ]);
      
      await fs.writeFile(path.join(context.cwd, 'README.md'), response, 'utf-8');
      return { success: true, output: `README.md generated:\n${response.slice(0, 500)}...` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
