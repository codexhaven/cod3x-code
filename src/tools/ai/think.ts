import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'think',
  description: 'Deep reasoning and analysis before taking action. Break down complex problems.',
  category: 'ai',
  requiresApproval: false,
  parameters: [
    { name: 'problem', type: 'string', description: 'Problem to think about', required: true },
    { name: 'steps', type: 'number', description: 'Number of reasoning steps', required: false, default: 5 },
  ],
  handler: async (params, context): Promise<any> => {
    const problem = params.problem as string;
    const steps = (params.steps as number) || 5;
    
    try {
      const prompt = `Think deeply about this problem step by step (${steps} steps):\n\n${problem}\n\nProvide your reasoning process and then a clear conclusion.`;
      
      const response = await context.llm.chat([
        { role: 'system', content: 'You are a deep reasoning engine. Think step by step thoroughly.' },
        { role: 'user', content: prompt },
      ]);
      
      return {
        success: true,
        output: `Deep analysis:\n${response}`,
        data: { steps, problem: problem.slice(0, 100) },
      };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
