import { execSync } from 'child_process';
export const definition = {
    name: 'lint_code',
    description: 'Run ESLint, Prettier, or other linters with auto-fix option',
    category: 'code',
    requiresApproval: true,
    parameters: [
        { name: 'path', type: 'string', description: 'Path to lint', required: true },
        { name: 'fix', type: 'boolean', description: 'Auto-fix issues', required: false },
        { name: 'formatter', type: 'string', description: 'eslint|prettier|black|ruff', required: false },
    ],
    handler: async (params, context) => {
        const filePath = params.path;
        const fix = params.fix === true;
        const formatter = params.formatter || 'eslint';
        try {
            const cwd = context.cwd;
            let cmd = '';
            switch (formatter) {
                case 'eslint':
                    cmd = `npx eslint "${filePath}"${fix ? ' --fix' : ''}`;
                    break;
                case 'prettier':
                    cmd = `npx prettier "${filePath}"${fix ? ' --write' : ' --check'}`;
                    break;
                case 'black':
                    cmd = `black ${fix ? '' : '--check '}"${filePath}"`;
                    break;
                case 'ruff':
                    cmd = `ruff check "${filePath}"${fix ? ' --fix' : ''}`;
                    break;
                default:
                    return { success: false, output: '', error: `Unknown formatter: ${formatter}` };
            }
            const output = execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
            return { success: true, output: output || `${formatter}: No issues found` };
        }
        catch (error) {
            const stdout = error.stdout?.toString() || '';
            const stderr = error.stderr?.toString() || error.message;
            return { success: fix && error.status === 0, output: stdout, error: stderr };
        }
    },
};
//# sourceMappingURL=lint.js.map