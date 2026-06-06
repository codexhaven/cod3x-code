import { execSync } from 'child_process';
export const definition = {
    name: 'find_files',
    description: 'Find files by name, size, date, or content patterns',
    category: 'filesystem',
    requiresApproval: false,
    parameters: [
        { name: 'name', type: 'string', description: 'Filename pattern', required: false },
        { name: 'size', type: 'string', description: 'Size filter (e.g., +1M)', required: false },
        { name: 'type', type: 'string', description: 'f=file, d=directory', required: false, default: 'f' },
        { name: 'path', type: 'string', description: 'Search path', required: false, default: '.' },
    ],
    handler: async (params, context) => {
        const searchPath = params.path || '.';
        let cmd = `find "${searchPath}"`;
        if (params.type)
            cmd += ` -type ${params.type}`;
        if (params.name)
            cmd += ` -name "${params.name}"`;
        if (params.size)
            cmd += ` -size ${params.size}`;
        cmd += ' 2>/dev/null';
        try {
            const output = execSync(cmd, { cwd: context.cwd, encoding: 'utf-8' }).trim();
            const files = output.split('\n').filter(Boolean);
            return {
                success: true,
                output: files.length > 0 ? `Found ${files.length}:\n${files.slice(0, 100).join('\n')}` : 'No files found',
                data: { count: files.length, files: files.slice(0, 100) },
            };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=find.js.map