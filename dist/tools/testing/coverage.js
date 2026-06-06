import { execSync } from 'child_process';
export const definition = {
    name: 'coverage_report',
    description: 'Generate and analyze test coverage reports',
    category: 'testing',
    requiresApproval: false,
    parameters: [
        { name: 'path', type: 'string', description: 'Path to analyze', required: false },
        { name: 'format', type: 'string', description: 'text|html|json|lcov', required: false, default: 'text' },
    ],
    handler: async (params, context) => {
        try {
            const format = params.format || 'text';
            let cmd = 'npx jest --coverage';
            if (format === 'json')
                cmd += ' --coverageReporters=json';
            else if (format === 'html')
                cmd += ' --coverageReporters=html';
            else if (format === 'lcov')
                cmd += ' --coverageReporters=lcov';
            const output = execSync(cmd, { cwd: context.cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
            return { success: true, output: output || 'Coverage report generated' };
        }
        catch (error) {
            return { success: false, output: error.stdout?.toString() || '', error: error.stderr?.toString() || error.message };
        }
    },
};
//# sourceMappingURL=coverage.js.map