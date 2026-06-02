import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'calculate_hash',
  description: 'Calculate MD5, SHA1, SHA256, or SHA512 hash of files or strings',
  category: 'utility',
  requiresApproval: false,
  parameters: [
    { name: 'path', type: 'string', description: 'File to hash', required: false },
    { name: 'text', type: 'string', description: 'Text to hash', required: false },
    { name: 'algorithm', type: 'string', description: 'md5|sha1|sha256|sha512', required: false, default: 'sha256' },
  ],
  handler: async (params, context): Promise<any> => {
    const algorithm = (params.algorithm as string) || 'sha256';
    
    try {
      let data: Buffer | string;
      
      if (params.path) {
        data = await fs.readFile(path.resolve(context.cwd, params.path as string));
      } else if (params.text) {
        data = params.text as string;
      } else {
        return { success: false, output: '', error: 'Provide path or text' };
      }
      
      const hash = crypto.createHash(algorithm).update(data).digest('hex');
      return { success: true, output: `${algorithm.toUpperCase()}: ${hash}`, data: { hash, algorithm } };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
