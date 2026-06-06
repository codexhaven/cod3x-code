import fs from 'fs/promises';
import path from 'path';
export const definition = {
    name: 'update_changelog',
    description: 'Update CHANGELOG.md following Keep a Changelog format',
    category: 'documentation',
    requiresApproval: true,
    parameters: [
        { name: 'version', type: 'string', description: 'Version number', required: true },
        { name: 'changes', type: 'string', description: 'Change description', required: true },
        { name: 'type', type: 'string', description: 'added|changed|deprecated|removed|fixed|security', required: false, default: 'added' },
    ],
    handler: async (params, context) => {
        const version = params.version;
        const changes = params.changes;
        const changeType = params.type || 'added';
        const changelogPath = path.join(context.cwd, 'CHANGELOG.md');
        try {
            let content = '';
            try {
                content = await fs.readFile(changelogPath, 'utf-8');
            }
            catch { /* new file */ }
            const date = new Date().toISOString().split('T')[0];
            const entry = `## [${version}] - ${date}\n\n### ${changeType.charAt(0).toUpperCase() + changeType.slice(1)}\n- ${changes}\n`;
            if (content) {
                // Insert after header
                const lines = content.split('\n');
                const headerEnd = lines.findIndex(l => l.startsWith('## ['));
                if (headerEnd >= 0) {
                    lines.splice(headerEnd, 0, entry);
                    content = lines.join('\n');
                }
                else {
                    content += '\n' + entry;
                }
            }
            else {
                content = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n${entry}`;
            }
            await fs.writeFile(changelogPath, content, 'utf-8');
            return { success: true, output: `CHANGELOG updated with ${version}: ${changes}` };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=update-changelog.js.map