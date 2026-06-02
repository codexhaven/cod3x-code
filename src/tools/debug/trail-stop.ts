import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'trail_stop',
  description: 'Stop the current debug trail and generate report',
  category: 'debug',
  requiresApproval: false,
  parameters: [
    { name: 'saveTo', type: 'string', description: 'Save trail to file', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    context.config.debug.trailEnabled = false;
    
    return {
      success: true,
      output: 'Debug trail stopped. Use trail_view to see the recorded operations.',
      data: { stopped: new Date().toISOString() },
    };
  },
};
