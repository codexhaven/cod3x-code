import { execSync } from 'child_process';
export const definition = {
    name: 'compress',
    description: 'Compress files using zip, tar, or gz',
    category: 'utility',
    requiresApproval: true,
    parameters: [
        { name: 'source', type: 'string', description: 'Source path', required: true },
        { name: 'output', type: 'string', description: 'Output archive', required: true },
        { name: 'format', type: 'string', description: 'zip|tar|gz', required: false, default: 'zip' },
    ],
    handler: async (params, context) => {
        try {
            const format = params.format || 'zip';
            let cmd = '';
            switch (format) {
                case 'zip':
                    cmd = `zip -r "${params.output}" "${params.source}"`;
                    break;
                case 'tar':
                    cmd = `tar -cvf "${params.output}" "${params.source}"`;
                    break;
                case 'gz':
                    cmd = `tar -czvf "${params.output}" "${params.source}"`;
                    break;
                default: return { success: false, output: '', error: `Unknown format: ${format}` };
            }
            const output = execSync(cmd, { cwd: context.cwd, encoding: 'utf-8' }).trim();
            return { success: true, output: `Compressed: ${params.output}\n${output}` };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=compress.js.map