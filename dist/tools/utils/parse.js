import fs from 'fs/promises';
import path from 'path';
export const definition = {
    name: 'parse_data',
    description: 'Parse and convert between JSON, YAML, TOML, CSV formats',
    category: 'utility',
    requiresApproval: false,
    parameters: [
        { name: 'path', type: 'string', description: 'File to parse', required: true },
        { name: 'format', type: 'string', description: 'json|yaml|toml|csv', required: false },
        { name: 'output', type: 'string', description: 'Output format for conversion', required: false },
    ],
    handler: async (params, context) => {
        try {
            const content = await fs.readFile(path.resolve(context.cwd, params.path), 'utf-8');
            const format = params.format || path.extname(params.path).slice(1);
            let data;
            switch (format) {
                case 'json':
                    data = JSON.parse(content);
                    break;
                case 'yaml':
                case 'yml': {
                    const yaml = await import('yaml');
                    data = yaml.parse(content);
                    break;
                }
                case 'toml': {
                    const toml = await import('toml');
                    data = toml.parse(content);
                    break;
                }
                case 'csv': {
                    const lines = content.split('\n').filter(Boolean);
                    const headers = lines[0].split(',');
                    data = lines.slice(1).map(l => {
                        const values = l.split(',');
                        return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i]?.trim()]));
                    });
                    break;
                }
                default: data = content;
            }
            const output = JSON.stringify(data, null, 2).slice(0, 5000);
            return { success: true, output: `Parsed (${format}):\n${output}${output.length >= 5000 ? '...' : ''}`, data };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=parse.js.map