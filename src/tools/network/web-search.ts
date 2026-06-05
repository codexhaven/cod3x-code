/**
 * ═══════════════════════════════════════════════════════════════
 * Web Search Tool - Cod3x Code v4.0 by CodexHaven
 * 
 * Cross-platform web search using curl (Termux) or Node.js https
 * Falls back to direct HTTP on all platforms
 * ═══════════════════════════════════════════════════════════════
 */

import { ToolDefinition, ToolResult, ToolContext } from '@codex-types/index';
import { execSync } from 'child_process';
import https from 'https';

export const definition: ToolDefinition = {
  name: 'web_search',
  description: 'Search the web using DuckDuckGo or fallback search engines. Works on all platforms including Termux.',
  category: 'network',
  requiresApproval: false,
  parameters: [
    { name: 'query', type: 'string', description: 'Search query', required: true },
    { name: 'maxResults', type: 'number', description: 'Maximum results to return', required: false, default: 5 },
  ],
  handler: async (params, context): Promise<ToolResult> => {
    const query = params.query as string;
    const maxResults = (params.maxResults as number) || 5;

    try {
      // On Termux, prefer curl for better compatibility
      if (context.platform.isTermux || context.platform.isMobile) {
        try {
          const encodedQuery = encodeURIComponent(query);
          const curlCmd = `curl -s -L --max-time 15 "https://html.duckduckgo.com/html/?q=${encodedQuery}" -H "User-Agent: Mozilla/5.0"`;
          const output = execSync(curlCmd, { encoding: 'utf-8', timeout: 20000 });
          
          const results = parseDuckDuckGoResults(output, maxResults);
          if (results.length > 0) {
            return {
              success: true,
              output: results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`).join('\n\n'),
              data: { query, results: results.length, source: 'duckduckgo-curl' },
            };
          }
        } catch {
          // Fall through to Node.js method
        }
      }

      // Node.js https method
      const encodedQuery = encodeURIComponent(query);
      const html = await fetchWithNode(`https://html.duckduckgo.com/html/?q=${encodedQuery}`);
      
      const results = parseDuckDuckGoResults(html, maxResults);
      
      if (results.length === 0) {
        return {
          success: true,
          output: `No results found for "${query}". Try a different query.`,
          data: { query, results: 0 },
        };
      }

      return {
        success: true,
        output: results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`).join('\n\n'),
        data: { query, results: results.length, source: 'duckduckgo-node' },
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: `Search failed: ${error.message}. Try using fetch_url directly with a search engine URL.`,
      };
    }
  },
};

function parseDuckDuckGoResults(html: string, max: number): Array<{ title: string; url: string; snippet: string }> {
  const results: Array<{ title: string; url: string; snippet: string }> = [];
  
  // Parse DuckDuckGo HTML results
  const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
  const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/gi;
  
  let titleMatch;
  let snippetMatch;
  const titles: Array<{ url: string; title: string }> = [];
  const snippets: string[] = [];
  
  while ((titleMatch = resultRegex.exec(html)) !== null && titles.length < max) {
    const cleanTitle = titleMatch[2].replace(/<[^>]*>/g, '').trim();
    let url = titleMatch[1];
    // DuckDuckGo uses redirect URLs
    if (url.startsWith('//')) url = 'https:' + url;
    titles.push({ url, title: cleanTitle });
  }
  
  while ((snippetMatch = snippetRegex.exec(html)) !== null && snippets.length < max) {
    const cleanSnippet = snippetMatch[1].replace(/<[^>]*>/g, '').trim();
    snippets.push(cleanSnippet);
  }
  
  for (let i = 0; i < titles.length; i++) {
    results.push({
      title: titles[i].title,
      url: titles[i].url,
      snippet: snippets[i] || '',
    });
  }
  
  return results;
}

function fetchWithNode(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        fetchWithNode(res.headers.location).then(resolve).catch(reject);
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('Timeout')); });
  });
}

export default definition;
