import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
export const definition = {
    name: 'calculate_hash',
    description: 'Calculate MD5, SHA1, SHA256, or SHA512 hash of files or strings',
    category: 'utility',
    requiresApproval: false,
    parameters: [
        { name: 'path', type: 'string', description: 'File to hash', required: false },
        { name: 'text', type: 'string', description: 'Text to hash', required: false },
        { name: 'algorithm', type: 'string', description: 'md5|sha1|sha256|sha512', required: false, default: 'sha256' },
    ],
    handler: async (params, context) => {
        const algorithm = params.algorithm || 'sha256';
        try {
            let data;
            if (params.path) {
                data = await fs.readFile(path.resolve(context.cwd, params.path));
            }
            else if (params.text) {
                data = params.text;
            }
            else {
                return { success: false, output: '', error: 'Provide path or text' };
            }
            const hash = crypto.createHash(algorithm).update(data).digest('hex');
            return { success: true, output: `${algorithm.toUpperCase()}: ${hash}`, data: { hash, algorithm } };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=hash.js.map