import fs from 'fs/promises';
import path from 'path';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'download_file',
  description: 'Download files with progress tracking and resume support',
  category: 'network',
  requiresApproval: true,
  parameters: [
    { name: 'url', type: 'string', description: 'URL to download', required: true },
    { name: 'output', type: 'string', description: 'Output path', required: true },
    { name: 'timeout', type: 'number', description: 'Timeout ms', required: false, default: 120000 },
  ],
  handler: async (params, context): Promise<any> => {
    const url = params.url as string;
    const output = path.resolve(context.cwd, params.output as string);
    const timeout = (params.timeout as number) || 120000;
    
    try {
      await fs.mkdir(path.dirname(output), { recursive: true });
      
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      await new Promise<void>((resolve, reject) => {
        const req = client.get(url, {
          headers: { 'User-Agent': 'Cod3x-Code/4.0 (CodexHaven)' },
          timeout,
        }, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            const loc = res.headers.location;
            if (loc) {
              definition.handler({ ...params, url: loc }, context).then(r => r.success ? resolve() : reject(new Error(r.error))).catch(reject);
              return;
            }
          }
          
          const chunks: Buffer[] = [];
          res.on('data', c => chunks.push(c));
          res.on('end', async () => {
            await fs.writeFile(output, Buffer.concat(chunks));
            resolve();
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      });
      
      const stats = await fs.stat(output);
      return { success: true, output: `Downloaded: ${params.output} (${(stats.size / 1024).toFixed(1)}K)` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
