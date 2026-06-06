export const definition = {
    name: 'count_tokens',
    description: 'Count tokens for LLM context estimation',
    category: 'code',
    requiresApproval: false,
    parameters: [
        { name: 'text', type: 'string', description: 'Text to count', required: false },
        { name: 'path', type: 'string', description: 'File to count', required: false },
    ],
    handler: async (params, context) => {
        let text = '';
        if (params.path) {
            const fs = await import('fs/promises');
            const path = await import('path');
            text = await fs.readFile(path.resolve(context.cwd, params.path), 'utf-8');
        }
        else {
            text = params.text || '';
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
//# sourceMappingURL=count-tokens.js.map