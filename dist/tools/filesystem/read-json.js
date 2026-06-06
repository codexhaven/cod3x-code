import fs from 'fs/promises';
import path from 'path';
export const definition = {
    name: 'read_json',
    description: 'Read and parse JSON files with optional path queries',
    category: 'filesystem',
    requiresApproval: false,
    parameters: [
        { name: 'path', type: 'string', description: 'JSON file path', required: true },
        { name: 'query', type: 'string', description: 'Dot-notation query (e.g., dependencies.react)', required: false },
    ],
    handler: async (params, context) => {
        try {
            const target = path.resolve(context.cwd, params.path);
            const content = await fs.readFile(target, 'utf-8');
            const parsed = JSON.parse(content);
            let result = parsed;
            const query = params.query;
            if (query) {
                for (const key of query.split('.')) {
                    result = result?.[key];
                }
            }
            const output = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
            return { success: true, output: output.slice(0, 5000), data: result };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=read-json.js.map