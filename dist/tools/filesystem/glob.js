import { glob } from 'glob';
export const definition = {
    name: 'glob_search',
    description: 'Search files using glob patterns with ignore support',
    category: 'filesystem',
    requiresApproval: false,
    parameters: [
        { name: 'pattern', type: 'string', description: 'Glob pattern', required: true },
        { name: 'ignore', type: 'string', description: 'Ignore pattern', required: false },
        { name: 'limit', type: 'number', description: 'Max results', required: false, default: 100 },
    ],
    handler: async (params, context) => {
        try {
            const files = await glob(params.pattern, {
                cwd: context.cwd,
                ignore: params.ignore,
                nodir: true,
                absolute: false,
            });
            const limited = files.slice(0, params.limit || 100);
            return {
                success: true,
                output: `Found ${files.length} files:\n${limited.join('\n')}${files.length > limited.length ? '\n...' : ''}`,
                data: { count: files.length, files: limited },
            };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=glob.js.map