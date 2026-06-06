import { execSync } from 'child_process';
export const definition = {
    name: 'snapshot_test',
    description: 'Manage Jest/Vitest snapshots (update, remove, test)',
    category: 'testing',
    requiresApproval: true,
    parameters: [
        { name: 'action', type: 'string', description: 'update|remove|test', required: true },
        { name: 'pattern', type: 'string', description: 'Test file pattern', required: false },
    ],
    handler: async (params, context) => {
        try {
            const action = params.action;
            const pattern = params.pattern || '';
            let cmd = '';
            if (action === 'update')
                cmd = `npx jest ${pattern} -u`;
            else if (action === 'remove')
                cmd = `npx jest ${pattern} --updateSnapshot=false`;
            else
                cmd = `npx jest ${pattern}`;
            const output = execSync(cmd, { cwd: context.cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
            return { success: true, output };
        }
        catch (error) {
            return { success: false, output: error.stdout?.toString() || '', error: error.stderr?.toString() || error.message };
        }
    },
};
//# sourceMappingURL=snapshot.js.map