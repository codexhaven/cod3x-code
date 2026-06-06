import fs from 'fs/promises';
import path from 'path';
export const definition = {
    name: 'copy_file',
    description: 'Copy files with automatic directory creation',
    category: 'filesystem',
    requiresApproval: true,
    parameters: [
        { name: 'source', type: 'string', description: 'Source path', required: true },
        { name: 'destination', type: 'string', description: 'Destination path', required: true },
    ],
    handler: async (params, context) => {
        try {
            const src = path.resolve(context.cwd, params.source);
            const dest = path.resolve(context.cwd, params.destination);
            await fs.mkdir(path.dirname(dest), { recursive: true });
            await fs.copyFile(src, dest);
            return { success: true, output: `Copied: ${params.source} -> ${params.destination}` };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=cp.js.map