import fs from 'fs/promises';
import path from 'path';
export const definition = {
    name: 'project_scripts',
    description: 'List and run npm/package scripts',
    category: 'project',
    requiresApproval: false,
    parameters: [
        { name: 'run', type: 'string', description: 'Script to run', required: false },
    ],
    handler: async (params, context) => {
        try {
            const pkg = JSON.parse(await fs.readFile(path.join(context.cwd, 'package.json'), 'utf-8'));
            const scripts = pkg.scripts || {};
            if (params.run) {
                const { execSync } = await import('child_process');
                const output = execSync(`npm run ${params.run}`, { cwd: context.cwd, encoding: 'utf-8' }).trim();
                return { success: true, output: `npm run ${params.run}:\n${output}` };
            }
            return {
                success: true,
                output: `Available scripts:\n${Object.entries(scripts).map(([k, v]) => `  ${k}: ${v}`).join('\n')}`,
                data: scripts,
            };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=scripts.js.map