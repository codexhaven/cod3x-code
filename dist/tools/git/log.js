import { execSync } from 'child_process';
export const definition = {
    name: 'git_log',
    description: 'Show commit history with filtering options',
    category: 'git',
    requiresApproval: false,
    parameters: [
        { name: 'limit', type: 'number', description: 'Number of commits', required: false, default: 20 },
        { name: 'path', type: 'string', description: 'Filter by path', required: false },
        { name: 'author', type: 'string', description: 'Filter by author', required: false },
        { name: 'since', type: 'string', description: 'Commits since date', required: false },
    ],
    handler: async (params, context) => {
        try {
            const cwd = context.cwd;
            const limit = params.limit || 20;
            const filePath = params.path;
            const author = params.author;
            const since = params.since;
            let cmd = `git log --oneline -n ${limit}`;
            if (author)
                cmd += ` --author="${author}"`;
            if (since)
                cmd += ` --since="${since}"`;
            if (filePath)
                cmd += ` -- "${filePath}"`;
            const output = execSync(cmd, { cwd, encoding: 'utf-8' }).trim();
            return { success: true, output: output || 'No commits found' };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=log.js.map