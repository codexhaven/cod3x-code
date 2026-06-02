import fs from 'fs/promises';
import path from 'path';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'generate_docs',
  description: 'Generate JSDoc, README, or API documentation from code',
  category: 'documentation',
  requiresApproval: true,
  parameters: [
    { name: 'path', type: 'string', description: 'Source file/directory', required: true },
    { name: 'type', type: 'string', description: 'jsdoc|README|API|wiki', required: false, default: 'README' },
    { name: 'output', type: 'string', description: 'Output path', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    const filePath = params.path as string;
    const type = (params.type as string) || 'README';
    
    try {
      const content = await fs.readFile(path.resolve(context.cwd, filePath), 'utf-8');
      
      const prompt = `Generate ${type} documentation for this code:\n\n${content}\n\nInclude:
1. Overview
2. Usage examples
3. API reference
4. Important details`;

      const response = await context.llm.chat([
        { role: 'system', content: 'You are a documentation expert for Cod3x by CodexHaven.' },
        { role: 'user', content: prompt },
      ]);
      
      if (params.output) {
        await fs.writeFile(path.resolve(context.cwd, params.output as string), response, 'utf-8');
      }
      
      return { success: true, output: response };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
