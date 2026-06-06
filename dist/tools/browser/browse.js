import https from 'https';
import http from 'http';
import { URL } from 'url';
// Simple browser tool that fetches and extracts readable content
export const definition = {
    name: 'browse_page',
    description: 'Browse a web page and extract readable content, links, and metadata',
    category: 'browser',
    requiresApproval: true,
    parameters: [
        { name: 'url', type: 'string', description: 'URL to browse', required: true },
        { name: 'extractLinks', type: 'boolean', description: 'Extract all links', required: false },
        { name: 'extractText', type: 'boolean', description: 'Extract main text content', required: false, default: true },
        { name: 'timeout', type: 'number', description: 'Timeout in ms', required: false, default: 30000 },
    ],
    handler: async (params, context) => {
        const url = params.url;
        const extractLinks = params.extractLinks === true;
        const extractText = params.extractText !== false;
        const timeout = params.timeout || 30000;
        try {
            const parsedUrl = new URL(url);
            const client = parsedUrl.protocol === 'https:' ? https : http;
            const body = await new Promise((resolve, reject) => {
                const req = client.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (Cod3x-Code/4.0)',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    },
                    timeout,
                }, (res) => {
                    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        // Follow redirects
                        const redirectUrl = new URL(res.headers.location, url).toString();
                        definition.handler({ ...params, url: redirectUrl }, context).then(r => resolve(r.output)).catch(reject);
                        return;
                    }
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => resolve(data));
                });
                req.on('error', reject);
                req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
            });
            let output = `Browsed: ${url}\n`;
            let extractedData = { url, title: '', links: [], text: '' };
            // Extract title
            const titleMatch = body.match(/<title[^>]*>(.*?)<\/title>/i);
            if (titleMatch) {
                output += `Title: ${titleMatch[1].trim()}\n`;
                extractedData.title = titleMatch[1].trim();
            }
            // Extract meta description
            const metaMatch = body.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
            if (metaMatch) {
                output += `Description: ${metaMatch[1].trim()}\n`;
            }
            if (extractText) {
                // Extract main text content (simple approach)
                let text = body
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                const maxLen = 5000;
                const truncated = text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
                output += `\nContent:\n${truncated}\n`;
                extractedData.text = truncated;
            }
            if (extractLinks) {
                const links = [];
                const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
                let match;
                while ((match = linkRegex.exec(body)) !== null) {
                    const href = match[1];
                    const text = match[2].replace(/<[^>]*>/g, '').trim();
                    if (href.startsWith('http') && text) {
                        links.push(`${text}: ${href}`);
                    }
                }
                extractedData.links = links.slice(0, 50);
                output += `\nLinks (${links.length}):\n${links.slice(0, 20).join('\n')}\n`;
            }
            return { success: true, output, data: extractedData };
        }
        catch (error) {
            return { success: false, output: '', error: `Browse failed: ${error.message}` };
        }
    },
};
//# sourceMappingURL=browse.js.map