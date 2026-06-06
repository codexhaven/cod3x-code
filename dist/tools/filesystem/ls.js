import fs from 'fs/promises';
import path from 'path';
export const definition = {
    name: 'list_directory',
    description: 'List directory contents with icons, sizes, and sorting',
    category: 'filesystem',
    requiresApproval: false,
    parameters: [
        { name: 'path', type: 'string', description: 'Directory path', required: false, default: '.' },
        { name: 'showHidden', type: 'boolean', description: 'Show hidden files', required: false },
        { name: 'longFormat', type: 'boolean', description: 'Show detailed info', required: false },
    ],
    handler: async (params, context) => {
        const dirPath = params.path || '.';
        const showHidden = params.showHidden === true;
        const longFormat = params.longFormat === true;
        try {
            const absolutePath = path.resolve(context.cwd, dirPath);
            const entries = await fs.readdir(absolutePath, { withFileTypes: true });
            let items = entries.filter(e => showHidden || !e.name.startsWith('.'));
            items.sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1));
            let output = `Directory: ${dirPath}\n`;
            for (const item of items) {
                const icon = item.isDirectory() ? '/' : item.isSymbolicLink() ? '@' : '';
                if (longFormat) {
                    const stats = await fs.stat(path.join(absolutePath, item.name));
                    const size = item.isDirectory() ? '-' : `${(stats.size / 1024).toFixed(1)}K`;
                    const date = stats.mtime.toISOString().slice(0, 10);
                    output += `  ${date} ${size.padStart(8)} ${item.name}${icon}\n`;
                }
                else {
                    output += `  ${item.name}${icon}\n`;
                }
            }
            return { success: true, output, data: { count: items.length } };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=ls.js.map