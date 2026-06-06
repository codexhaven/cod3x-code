import fs from 'fs/promises';
import path from 'path';
export const definition = {
    name: 'project_info',
    description: 'Get project metadata from package.json, git, and structure',
    category: 'project',
    requiresApproval: false,
    parameters: [],
    handler: async (params, context) => {
        try {
            const cwd = context.cwd;
            let output = `Project Info:\n`;
            // Try package.json
            try {
                const pkg = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf-8'));
                output += `  Name: ${pkg.name}\n  Version: ${pkg.version}\n  Description: ${pkg.description || 'N/A'}\n  Dependencies: ${Object.keys(pkg.dependencies || {}).length}\n  DevDeps: ${Object.keys(pkg.devDependencies || {}).length}\n`;
            }
            catch {
                output += '  No package.json found\n';
            }
            // Git info
            try {
                const { execSync } = await import('child_process');
                const branch = execSync('git branch --show-current', { cwd, encoding: 'utf-8' }).trim();
                output += `  Git branch: ${branch}\n`;
            }
            catch {
                output += '  Not a git repository\n';
            }
            output += `  Cod3x by CodexHaven v4.0`;
            return { success: true, output };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=info.js.map