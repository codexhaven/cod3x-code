import fs from 'fs/promises';
import path from 'path';
export const definition = {
    name: 'env_manager',
    description: 'Read, write, and manage .env files',
    category: 'utility',
    requiresApproval: true,
    parameters: [
        { name: 'file', type: 'string', description: '.env file path', required: false, default: '.env' },
        { name: 'action', type: 'string', description: 'read|set|remove', required: true },
        { name: 'key', type: 'string', description: 'Variable name', required: false },
        { name: 'value', type: 'string', description: 'Variable value', required: false },
    ],
    handler: async (params, context) => {
        const file = path.resolve(context.cwd, params.file || '.env');
        const action = params.action;
        try {
            let content = '';
            try {
                content = await fs.readFile(file, 'utf-8');
            }
            catch { /* new file */ }
            const lines = content.split('\n').filter(Boolean);
            const vars = new Map();
            for (const line of lines) {
                const match = line.match(/^([^#=]+)=(.*)$/);
                if (match)
                    vars.set(match[1].trim(), match[2].trim());
            }
            if (action === 'read') {
                return {
                    success: true,
                    output: `Environment variables (${vars.size}):\n${[...vars.entries()].map(([k, v]) => `  ${k}=${v.slice(0, 20)}${v.length > 20 ? '...' : ''}`).join('\n')}`,
                    data: Object.fromEntries(vars),
                };
            }
            if (action === 'set' && params.key) {
                vars.set(params.key, params.value || '');
                const output = [...vars.entries()].map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
                await fs.writeFile(file, output, 'utf-8');
                return { success: true, output: `Set: ${params.key}=***` };
            }
            if (action === 'remove' && params.key) {
                vars.delete(params.key);
                const output = [...vars.entries()].map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
                await fs.writeFile(file, output, 'utf-8');
                return { success: true, output: `Removed: ${params.key}` };
            }
            return { success: false, output: '', error: 'Invalid action' };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=env.js.map