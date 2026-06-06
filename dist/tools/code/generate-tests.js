export const definition = {
    name: 'generate_tests',
    description: 'Generate unit and integration tests for code files',
    category: 'code',
    requiresApproval: true,
    parameters: [
        { name: 'path', type: 'string', description: 'File to generate tests for', required: true },
        { name: 'framework', type: 'string', description: 'jest|vitest|pytest|go-test', required: false },
        { name: 'coverage', type: 'boolean', description: 'Include coverage annotations', required: false },
    ],
    handler: async (params, context) => {
        const filePath = params.path;
        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const content = await fs.readFile(path.resolve(context.cwd, filePath), 'utf-8');
            const prompt = `Generate comprehensive unit tests for this code:\n\n${content}\n\nUse ${params.framework || 'the appropriate testing framework'}. Include:
1. Happy path tests
2. Edge case tests  
3. Error handling tests
4. Input validation tests`;
            const response = await context.llm.chat([
                { role: 'system', content: 'You are a test generation expert.' },
                { role: 'user', content: prompt },
            ]);
            return { success: true, output: response };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=generate-tests.js.map