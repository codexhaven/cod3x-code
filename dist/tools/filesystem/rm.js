import fs from 'fs/promises';
import path from 'path';
export const definition = {
    name: 'remove_file',
    description: 'Remove files or directories with confirmation',
    category: 'filesystem',
    requiresApproval: true,
    parameters: [
        { name: 'path', type: 'string', description: 'Path to remove', required: true },
        { name: 'recursive', type: 'boolean', description: 'Remove directories', required: false },
    ],
    handler: async (params, context) => {
        try {
            const target = path.resolve(context.cwd, params.path);
            const stats = await fs.stat(target);
            if (stats.isDirectory() && params.recursive) {
                await fs.rm(target, { recursive: true });
            }
            else {
                await fs.unlink(target);
            }
            return { success: true, output: `Removed: ${params.path}` };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=rm.js.map