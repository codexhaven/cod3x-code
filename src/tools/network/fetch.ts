import { ToolDefinition } from '@codex-types/index';
import http from 'http';
import https from 'https';
import { URL } from 'url';

export const definition: ToolDefinition = {
  name: 'fetch_url',
  description: 'HTTP requests with support for GET, POST, PUT, DELETE, PATCH with custom headers',
  category: 'network',
  requiresApproval: true,
  parameters: [
    { name: 'url', type: 'string', description: 'URL to fetch', required: true },
    { name: 'method', type: 'string', description: 'HTTP method', required: false, default: 'GET' },
    { name: 'headers', type: 'object', description: 'Custom headers', required: false },
    { name: 'body', type: 'string', description: 'Request body', required: false },
    { name: 'timeout', type: 'number', description: 'Timeout in ms', required: false, default: 30000 },
  ],
  handler: async (params, context): Promise<any> => {
    const url = params.url as string;
    const method = (params.method as string) || 'GET';
    const headers = (params.headers as Record<string, string>) || {};
    const body = params.body as string | undefined;
    const timeout = (params.timeout as number) || 30000;

    try {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const response = await new Promise<{ status: number; headers: any; body: string }>((resolve, reject) => {
        const req = client.request(
          {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method,
            headers: {
              'User-Agent': 'Cod3x-Code/4.0 (CodexHaven)',
              ...headers,
            },
            timeout,
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers, body: data }));
          }
        );

        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        if (body) req.write(body);
        req.end();
      });

      return {
        success: response.status >= 200 && response.status < 300,
        output: response.body.slice(0, context.config.limits.maxOutputSize),
        data: { status: response.status, headers: response.headers, url },
      };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
