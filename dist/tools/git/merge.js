import { execSync } from 'child_process';
export const definition = {
    name: 'git_merge',
    description: 'Merge branches with conflict detection',
    category: 'git',
    requiresApproval: true,
    parameters: [
        { name: 'branch', type: 'string', description: 'Branch to merge', required: true },
        { name: 'noFastForward', type: 'boolean', description: 'Create merge commit', required: false },
    ],
    handler: async (params, context) => {
        try {
            const cwd = context.cwd;
            const branch = params.branch;
            const noFF = params.noFastForward === true;
            const cmd = `git merge ${noFF ? '--no-ff ' : ''}"${branch}"`;
            execSync(cmd, { cwd, encoding: 'utf-8' });
            return { success: true, output: `Merged: ${branch}` };
        }
        catch (error) {
            const hasConflicts = error.message?.includes('CONFLICT');
            return { success: false, output: '', error: hasConflicts ? `Merge conflicts! Resolve manually. ${error.message}` : error.message };
        }
    },
};
//# sourceMappingURL=merge.js.map