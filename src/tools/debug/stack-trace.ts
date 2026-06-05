import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'stack_trace',
  description: 'Capture and display the current execution stack trace',
  category: 'debug',
  requiresApproval: false,
  parameters: [
    { name: 'limit', type: 'number', description: 'Max frames', required: false, default: 20 },
  ],
  handler: async (params, context): Promise<any> => {
    const limit = (params.limit as number) || 20;
    const stack = new Error().stack?.split('\n').slice(1, limit + 1).join('\n') || 'No stack trace available';
    
    return {
      success: true,
      output: `Stack trace (top ${limit} frames):\n${stack}`,
      data: { frames: stack.split('\n').length },
    };
  },
};
