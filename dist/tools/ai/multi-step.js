export const definition = {
    name: 'multi_step',
    description: 'Execute multi-step tool chaining workflows with dependencies',
    category: 'ai',
    requiresApproval: true,
    parameters: [
        { name: 'workflow', type: 'string', description: 'Workflow description', required: true },
        { name: 'steps', type: 'array', description: 'Array of step descriptions', required: true },
    ],
    handler: async (params, context) => {
        const workflow = params.workflow;
        const steps = params.steps;
        let output = `Multi-step workflow: ${workflow}\n`;
        const results = [];
        for (let i = 0; i < steps.length; i++) {
            output += `\n--- Step ${i + 1}/${steps.length}: ${steps[i]} ---\n`;
            try {
                const result = await context.llm.chat([
                    { role: 'system', content: `You are executing a multi-step workflow: ${workflow}` },
                    { role: 'user', content: `Step ${i + 1}: ${steps[i]}\n\nPrevious results: ${JSON.stringify(results.slice(-2))}` },
                ]);
                output += result + '\n';
                results.push({ step: i + 1, result });
            }
            catch (error) {
                output += `Error: ${error.message}\n`;
                results.push({ step: i + 1, error: error.message });
            }
        }
        return { success: true, output, data: { steps: steps.length, completed: results.length } };
    },
};
//# sourceMappingURL=multi-step.js.map