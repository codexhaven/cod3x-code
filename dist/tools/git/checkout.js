import { execSync } from 'child_process';
export const definition = {
    name: 'git_checkout',
    description: 'Switch branches or restore files',
    category: 'git',
    requiresApproval: true,
    parameters: [
        { name: 'branch', type: 'string', description: 'Branch to checkout', required: true },
        { name: 'create', type: 'boolean', description: 'Create new branch', required: false },
    ],
    handler: async (params, context) => {
        try {
            const cwd = context.cwd;
            const branch = params.branch;
            const create = params.create === true;
            const cmd = create ? `git checkout -b "${branch}"` : `git checkout "${branch}"`;
            execSync(cmd, { cwd, encoding: 'utf-8' });
            return { success: true, output: `Checked out: ${branch}${create ? ' (new)' : ''}` };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=checkout.js.map