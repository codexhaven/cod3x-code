import { execSync } from 'child_process';
export const definition = {
    name: 'git_diff',
    description: 'Show differences between commits, branches, or working tree',
    category: 'git',
    requiresApproval: false,
    parameters: [
        { name: 'from', type: 'string', description: 'From commit/branch', required: false },
        { name: 'to', type: 'string', description: 'To commit/branch', required: false },
        { name: 'path', type: 'string', description: 'Specific file path', required: false },
        { name: 'stat', type: 'boolean', description: 'Show stat only', required: false },
    ],
    handler: async (params, context) => {
        try {
            const cwd = context.cwd;
            const from = params.from;
            const to = params.to;
            const filePath = params.path;
            const stat = params.stat === true;
            let cmd = 'git diff';
            if (from)
                cmd += ` ${from}`;
            if (to)
                cmd += ` ${to}`;
            if (stat)
                cmd += ' --stat';
            if (filePath)
                cmd += ` -- "${filePath}"`;
            const output = execSync(cmd, { cwd, encoding: 'utf-8' }).trim();
            return { success: true, output: output || 'No differences' };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=diff.js.map