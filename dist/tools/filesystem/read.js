import fs from 'fs/promises';
import path from 'path';
export const definition = {
    name: 'read_file',
    description: 'Read file contents with encoding, offset, and limit support',
    category: 'filesystem',
    requiresApproval: false,
    parameters: [
        { name: 'path', type: 'string', description: 'File path to read', required: true },
        { name: 'encoding', type: 'string', description: 'File encoding', required: false, default: 'utf-8' },
        { name: 'offset', type: 'number', description: 'Start line offset', required: false },
        { name: 'limit', type: 'number', description: 'Max lines to read', required: false, default: 200 },
    ],
    handler: async (params, context) => {
        const filePath = params.path;
        const encoding = params.encoding || 'utf-8';
        const offset = params.offset || 0;
        const limit = params.limit || 200;
        try {
            const absolutePath = path.resolve(context.cwd, filePath);
            if (!absolutePath.startsWith(context.cwd) && !context.config.permissions.allowedPaths.some((p) => absolutePath.startsWith(path.resolve(p)))) {
                return { success: false, output: '', error: `Security: Path ${filePath} is outside allowed directories` };
            }
            const content = await fs.readFile(absolutePath, encoding);
            const lines = content.split('\n');
            const sliced = lines.slice(offset, offset + limit);
            return {
                success: true,
                output: sliced.join('\n'),
                data: { path: filePath, lines: lines.length, offset, limit, size: content.length },
            };
        }
        catch (error) {
            return { success: false, output: '', error: `Read error: ${error.message}` };
        }
    },
};
export default definition;
//# sourceMappingURL=read.js.map