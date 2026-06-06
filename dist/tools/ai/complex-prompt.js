export const definition = {
    name: 'complex_prompt',
    description: 'Multi-step reasoning with chain-of-thought for complex queries',
    category: 'ai',
    requiresApproval: false,
    parameters: [
        { name: 'prompt', type: 'string', description: 'Complex prompt', required: true },
        { name: 'context', type: 'string', description: 'Additional context', required: false },
    ],
    handler: async (params, context) => {
        try {
            const messages = [
                { role: 'system', content: 'You are an advanced reasoning engine. Use chain-of-thought reasoning. Break complex problems into steps.' },
                { role: 'user', content: params.context ? `Context: ${params.context}\n\n${params.prompt}` : params.prompt },
            ];
            const response = await context.llm.chat(messages);
            return {
                success: true,
                output: response,
            };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=complex-prompt.js.map