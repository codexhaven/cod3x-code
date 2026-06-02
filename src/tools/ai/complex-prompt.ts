import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'complex_prompt',
  description: 'Multi-step reasoning with chain-of-thought for complex queries',
  category: 'ai',
  requiresApproval: false,
  parameters: [
    { name: 'prompt', type: 'string', description: 'Complex prompt', required: true },
    { name: 'context', type: 'string', description: 'Additional context', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const messages = [
        { role: 'system' as const, content: 'You are an advanced reasoning engine. Use chain-of-thought reasoning. Break complex problems into steps.' },
        { role: 'user' as const, content: params.context ? `Context: ${params.context}\n\n${params.prompt}` : params.prompt as string },
      ];
      
      const response = await context.llm.chat(messages);
      
      return {
        success: true,
        output: response,
      };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
