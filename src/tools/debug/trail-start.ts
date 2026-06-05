import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'trail_start',
  description: 'Start an execution debug trail to track all operations',
  category: 'debug',
  requiresApproval: false,
  parameters: [
    { name: 'name', type: 'string', description: 'Trail name', required: false },
    { name: 'captureStackTrace', type: 'boolean', description: 'Capture stack traces', required: false, default: true },
  ],
  handler: async (params, context): Promise<any> => {
    const name = (params.name as string) || `trail-${Date.now()}`;
    context.config.debug.trailEnabled = true;
    
    return {
      success: true,
      output: `Debug trail started: ${name}\nAll subsequent operations will be recorded.`,
      data: { trailId: name, started: new Date().toISOString() },
    };
  },
};
