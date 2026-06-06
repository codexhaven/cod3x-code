import { execSync } from 'child_process';
export const definition = {
    name: 'git_branch',
    description: 'List, create, or delete branches',
    category: 'git',
    requiresApproval: true,
    parameters: [
        { name: 'name', type: 'string', description: 'Branch name to create', required: false },
        { name: 'delete', type: 'string', description: 'Branch to delete', required: false },
        { name: 'list', type: 'boolean', description: 'List all branches', required: false, default: true },
        { name: 'remote', type: 'boolean', description: 'Include remote branches', required: false },
    ],
    handler: async (params, context) => {
        try {
            const cwd = context.cwd;
            const name = params.name;
            const del = params.delete;
            const list = params.list !== false;
            const remote = params.remote === true;
            if (name) {
                execSync(`git branch "${name}"`, { cwd, encoding: 'utf-8' });
                return { success: true, output: `Created branch: ${name}` };
            }
            if (del) {
                execSync(`git branch -D "${del}"`, { cwd, encoding: 'utf-8' });
                return { success: true, output: `Deleted branch: ${del}` };
            }
            if (list) {
                const flag = remote ? '-a' : '';
                const output = execSync(`git branch ${flag}`, { cwd, encoding: 'utf-8' }).trim();
                return { success: true, output: output || 'No branches' };
            }
            return { success: true, output: 'No operation specified' };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=branch.js.map