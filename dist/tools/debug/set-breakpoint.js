export const definition = {
    name: 'set_breakpoint',
    description: 'Set a conditional breakpoint that triggers on specific operations',
    category: 'debug',
    requiresApproval: false,
    parameters: [
        { name: 'condition', type: 'string', description: 'Condition to trigger on (tool_name|error|file_access)', required: true },
        { name: 'action', type: 'string', description: 'pause|log|notify', required: false, default: 'pause' },
    ],
    handler: async (params, context) => {
        const condition = params.condition;
        const action = params.action || 'log';
        return {
            success: true,
            output: `Breakpoint set: trigger on "${condition}" with action "${action}"`,
            data: { condition, action, set: new Date().toISOString() },
        };
    },
};
//# sourceMappingURL=set-breakpoint.js.map