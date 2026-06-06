/**
 * ═══════════════════════════════════════════════════════════════
 * Edit File Tool - Cod3x Code v4.0 by CodexHaven
 * ═══════════════════════════════════════════════════════════════
 */
import fs from 'fs/promises';
import path from 'path';
export const definition = {
    name: 'edit_file',
    description: 'Edit files with pattern replacement, regex, line insertion, or line deletion. Creates automatic backups.',
    category: 'filesystem',
    requiresApproval: true,
    parameters: [
        { name: 'path', type: 'string', description: 'File path to edit', required: true },
        { name: 'search', type: 'string', description: 'Text or pattern to find', required: true },
        { name: 'replace', type: 'string', description: 'Replacement text', required: true },
        { name: 'regex', type: 'boolean', description: 'Use regex for search', required: false, default: false },
        { name: 'insertAt', type: 'number', description: 'Insert at line number instead of replace', required: false },
        { name: 'deleteLines', type: 'string', description: 'Delete line range (e.g., "5-10")', required: false },
    ],
    handler: async (params, context) => {
        const filePath = params.path;
        const search = params.search;
        const replace = params.replace;
        const useRegex = params.regex === true;
        const insertAt = params.insertAt;
        const deleteLines = params.deleteLines;
        try {
            const absolutePath = path.resolve(context.cwd, filePath);
            if (!absolutePath.startsWith(context.cwd) && !context.config.permissions.allowedPaths.some((p) => absolutePath.startsWith(path.resolve(p)))) {
                return { success: false, output: '', error: `Security: Path outside allowed directories` };
            }
            const content = await fs.readFile(absolutePath, 'utf-8');
            const lines = content.split('\n');
            let modified = content;
            let changes = 0;
            // Create backup
            await fs.writeFile(absolutePath + '.bak', content, 'utf-8');
            if (deleteLines) {
                const [start, end] = deleteLines.split('-').map(Number);
                const deleteStart = Math.max(0, start - 1);
                const deleteEnd = end ? Math.min(lines.length, end) : deleteStart + 1;
                lines.splice(deleteStart, deleteEnd - deleteStart);
                modified = lines.join('\n');
                changes = deleteEnd - deleteStart;
            }
            else if (insertAt !== undefined) {
                const lineIndex = Math.max(0, Math.min(insertAt - 1, lines.length));
                lines.splice(lineIndex, 0, replace);
                modified = lines.join('\n');
                changes = 1;
            }
            else if (useRegex) {
                const regex = new RegExp(search, 'g');
                modified = content.replace(regex, replace);
                changes = (content.match(regex) || []).length;
            }
            else {
                modified = content.split(search).join(replace);
                changes = (content.match(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            }
            await fs.writeFile(absolutePath, modified, 'utf-8');
            return {
                success: true,
                output: `Edited ${filePath}: ${changes} change(s) made. ${modified.length - content.length} bytes diff.`,
                data: { path: filePath, changes, diff: modified.length - content.length },
            };
        }
        catch (error) {
            return { success: false, output: '', error: `Edit error: ${error.message}` };
        }
    },
};
export default definition;
//# sourceMappingURL=edit.js.map