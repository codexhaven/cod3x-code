import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'count_tokens',
  description: 'Count tokens for LLM context estimation',
  category: 'code',
  requiresApproval: false,
  parameters: [
    { name: 'text', type: 'string', description: 'Text to count', required: false },
    { name: 'path', type: 'string', description: 'File to count', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    let text = '';
    
    if (params.path) {
      const fs = await import('fs/promises');
      const path = await import('path');
      text = await fs.readFile(path.resolve(context.cwd, params.path as string), 'utf-8');
    } else {
      text = params.text as string || '';
    }
    
    const charCount = text.length;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const lineCount = text.split('\n').length;
    const approxTokens = Math.ceil(charCount / 4);
    
    return {
      success: true,
      output: `Token estimate:
  Characters: ${charCount.toLocaleString()}
  Words: ${wordCount.toLocaleString()}
  Lines: ${lineCount.toLocaleString()}
  Approx tokens: ${approxTokens.toLocaleString()}`,
      data: { charCount, wordCount, lineCount, approxTokens },
    };
  },
};
