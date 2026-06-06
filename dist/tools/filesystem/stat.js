import fs from 'fs/promises';
import path from 'path';
export const definition = {
    name: 'file_stat',
    description: 'Get detailed file information including size, dates, permissions',
    category: 'filesystem',
    requiresApproval: false,
    parameters: [
        { name: 'path', type: 'string', description: 'File path', required: true },
    ],
    handler: async (params, context) => {
        try {
            const target = path.resolve(context.cwd, params.path);
            const stats = await fs.stat(target);
            return {
                success: true,
                output: `File: ${params.path}
Size: ${(stats.size / 1024).toFixed(2)} KB (${stats.size} bytes)
Created: ${stats.birthtime.toISOString()}
Modified: ${stats.mtime.toISOString()}
Accessed: ${stats.atime.toISOString()}
Mode: ${stats.mode.toString(8)}
IsFile: ${stats.isFile()}
IsDirectory: ${stats.isDirectory()}`,
                data: { ...stats, path: params.path },
            };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=stat.js.map