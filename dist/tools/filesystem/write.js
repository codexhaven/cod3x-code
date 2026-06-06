/**
 * ═══════════════════════════════════════════════════════════════
 * Write File Tool - Cod3x Code v4.0 by CodexHaven
 * ═══════════════════════════════════════════════════════════════
 */
import fs from 'fs/promises';
import path from 'path';
export const definition = {
    name: 'write_file',
    description: 'Create or overwrite files with content. Supports backups and directory creation.',
    category: 'filesystem',
    requiresApproval: true,
    parameters: [
        { name: 'path', type: 'string', description: 'File path to write', required: true },
        { name: 'content', type: 'string', description: 'File content', required: true },
        { name: 'overwrite', type: 'boolean', description: 'Allow overwriting existing files', required: false, default: true },
        { name: 'createBackup', type: 'boolean', description: 'Create .bak backup of existing file', required: false, default: true },
        { name: 'encoding', type: 'string', description: 'File encoding', required: false, default: 'utf-8' },
    ],
    handler: async (params, context) => {
        const filePath = params.path;
        const content = params.content;
        const overwrite = params.overwrite !== false;
        const createBackup = params.createBackup !== false;
        const encoding = params.encoding || 'utf-8';
        try {
            const absolutePath = path.resolve(context.cwd, filePath);
            // Security check
            if (!absolutePath.startsWith(context.cwd) && !context.config.permissions.allowedPaths.some((p) => absolutePath.startsWith(path.resolve(p)))) {
                return { success: false, output: '', error: `Security: Path ${filePath} is outside allowed directories` };
            }
            // Check if exists
            let existed = false;
            try {
                await fs.access(absolutePath);
                existed = true;
                if (!overwrite) {
                    return { success: false, output: '', error: `File exists and overwrite is false: ${filePath}` };
                }
            }
            catch { /* doesn't exist */ }
            // Create backup
            if (existed && createBackup) {
                const backupPath = absolutePath + '.bak';
                const existing = await fs.readFile(absolutePath, encoding);
                await fs.writeFile(backupPath, existing, encoding);
            }
            // Create directory if needed
            await fs.mkdir(path.dirname(absolutePath), { recursive: true });
            // Write file
            await fs.writeFile(absolutePath, content, encoding);
            return {
                success: true,
                output: `File written: ${filePath} (${content.length} bytes)`,
                data: { path: filePath, size: content.length, backup: existed && createBackup },
            };
        }
        catch (error) {
            return { success: false, output: '', error: `Write error: ${error.message}` };
        }
    },
};
export default definition;
//# sourceMappingURL=write.js.map