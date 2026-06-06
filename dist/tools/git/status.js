import { execSync } from 'child_process';
export const definition = {
    name: 'git_status',
    description: 'Show git status: branch, staged, modified, untracked files',
    category: 'git',
    requiresApproval: false,
    parameters: [
        { name: 'path', type: 'string', description: 'Repository path', required: false },
    ],
    handler: async (params, context) => {
        try {
            const cwd = params.path || context.cwd;
            const branch = execSync('git branch --show-current', { cwd, encoding: 'utf-8' }).trim();
            const status = execSync('git status --short', { cwd, encoding: 'utf-8' }).trim();
            const staged = [];
            const modified = [];
            const untracked = [];
            for (const line of status.split('\n').filter(Boolean)) {
                const st = line.slice(0, 2);
                const file = line.slice(3);
                if (st[0] !== ' ' && st[0] !== '?')
                    staged.push(file);
                if (st[1] === 'M')
                    modified.push(file);
                if (st === '??')
                    untracked.push(file);
            }
            return {
                success: true,
                output: `Branch: ${branch}\nStaged: ${staged.length}\nModified: ${modified.length}\nUntracked: ${untracked.length}${status ? '\n\n' + status : ''}`,
                data: { branch, staged, modified, untracked },
            };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=status.js.map