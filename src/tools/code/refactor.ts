import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'refactor_code',
  description: 'AI-powered code refactoring with specific instructions',
  category: 'code',
  requiresApproval: true,
  parameters: [
    { name: 'path', type: 'string', description: 'File to refactor', required: true },
    { name: 'instructions', type: 'string', description: 'Refactoring instructions', required: true },
    { name: 'preview', type: 'boolean', description: 'Preview changes only', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    const filePath = params.path as string;
    const instructions = params.instructions as string;
    
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const content = await fs.readFile(path.resolve(context.cwd, filePath), 'utf-8');
      
      const prompt = `Refactor this code according to: ${instructions}\n\n${content}\n\nReturn ONLY the refactored code, no explanations.`;
      
      const response = await context.llm.chat([
        { role: 'system', content: 'You are a refactoring expert. Return only code.' },
        { role: 'user', content: prompt },
      ]);
      
      if (!params.preview) {
        await fs.writeFile(path.resolve(context.cwd, filePath) + '.refactored', response, 'utf-8');
      }
      
      return { success: true, output: params.preview ? response : `Refactored code saved to ${filePath}.refactored\n\nPreview:\n${response.slice(0, 1000)}...` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
