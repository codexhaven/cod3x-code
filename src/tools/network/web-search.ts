import https from 'https';
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'web_search',
  description: 'Search the web using DuckDuckGo or alternative search engines',
  category: 'network',
  requiresApproval: false,
  parameters: [
    { name: 'query', type: 'string', description: 'Search query', required: true },
    { name: 'limit', type: 'number', description: 'Max results', required: false, default: 10 },
  ],
  handler: async (params, context): Promise<any> => {
    const query = encodeURIComponent(params.query as string);
    const limit = (params.limit as number) || 10;

    try {
      // Use DuckDuckGo HTML search
      const url = `https://html.duckduckgo.com/html/?q=${query}`;
      
      const body = await new Promise<string>((resolve, reject) => {
        const req = https.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Cod3x-Code/4.0)',
          },
          timeout: 15000,
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      });

      // Parse results from HTML
      const results: string[] = [];
      const regex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
      let match;
      
      while ((match = regex.exec(body)) !== null && results.length < limit) {
        const href = match[1].replace(/&amp;/g, '&');
        const title = match[2].replace(/<[^>]*>/g, '').trim();
        if (title && href) {
          results.push(`${title}\n  ${href}`);
        }
      }

      if (results.length === 0) {
        return { success: true, output: 'No results found. Try a different query.' };
      }

      return {
        success: true,
        output: `Search results for "${params.query}":\n\n${results.join('\n\n')}`,
        data: { count: results.length },
      };
    } catch (error: any) {
      return { success: false, output: '', error: `Search failed: ${error.message}` };
    }
  },
};
