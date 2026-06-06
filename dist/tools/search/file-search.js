import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';
export const definition = {
    name: 'file_search',
    description: 'Search files by metadata: name, size, modification date, extension',
    category: 'search',
    requiresApproval: false,
    parameters: [
        { name: 'name', type: 'string', description: 'Filename pattern', required: false },
        { name: 'extension', type: 'string', description: 'File extension', required: false },
        { name: 'minSize', type: 'number', description: 'Minimum size in bytes', required: false },
        { name: 'maxSize', type: 'number', description: 'Maximum size in bytes', required: false },
        { name: 'modifiedAfter', type: 'string', description: 'ISO date string', required: false },
    ],
    handler: async (params, context) => {
        try {
            const pattern = params.name ? `**/${params.name}` : params.extension ? `**/*.${params.extension}` : '**/*';
            const files = await glob(pattern, { cwd: context.cwd, ignore: 'node_modules/**', nodir: true });
            let results = files;
            if (params.minSize || params.maxSize || params.modifiedAfter) {
                const filtered = [];
                for (const f of files.slice(0, 200)) {
                    const stats = await fs.stat(path.join(context.cwd, f)).catch(() => null);
                    if (!stats)
                        continue;
                    if (params.minSize && stats.size < params.minSize)
                        continue;
                    if (params.maxSize && stats.size > params.maxSize)
                        continue;
                    if (params.modifiedAfter && stats.mtime < new Date(params.modifiedAfter))
                        continue;
                    filtered.push(`${f} (${(stats.size / 1024).toFixed(1)}K, ${stats.mtime.toISOString().slice(0, 10)})`);
                }
                results = filtered;
            }
            return {
                success: true,
                output: `Found ${results.length} files:\n${results.slice(0, 50).join('\n')}`,
                data: { count: results.length },
            };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=file-search.js.map