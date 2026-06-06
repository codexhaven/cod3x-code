import fs from 'fs/promises';
import path from 'path';
export const definition = {
    name: 'project_dependencies',
    description: 'Analyze project dependencies, versions, and potential issues',
    category: 'project',
    requiresApproval: false,
    parameters: [
        { name: 'outdated', type: 'boolean', description: 'Check for outdated packages', required: false },
    ],
    handler: async (params, context) => {
        try {
            const pkg = JSON.parse(await fs.readFile(path.join(context.cwd, 'package.json'), 'utf-8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            let output = `Dependencies (${Object.keys(deps).length}):\n`;
            for (const [name, version] of Object.entries(deps)) {
                output += `  ${name}: ${version}\n`;
            }
            if (params.outdated) {
                try {
                    const { execSync } = await import('child_process');
                    const outdated = execSync('npm outdated --json 2>/dev/null || true', { cwd: context.cwd, encoding: 'utf-8' });
                    if (outdated && outdated !== 'true') {
                        const parsed = JSON.parse(outdated);
                        const outdatedList = Object.entries(parsed).filter(([k, v]) => v.current !== v.latest);
                        if (outdatedList.length > 0) {
                            output += `\nOutdated packages:\n`;
                            for (const [name, v] of outdatedList) {
                                const vv = v;
                                output += `  ${name}: ${vv.current} -> ${vv.latest}\n`;
                            }
                        }
                    }
                }
                catch { /* ignore */ }
            }
            return { success: true, output, data: { count: Object.keys(deps).length } };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=dependencies.js.map