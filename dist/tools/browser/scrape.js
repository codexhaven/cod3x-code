import { definition as browseDefinition } from './browse.js';
export const definition = {
    name: 'scrape_content',
    description: 'Scrape structured content from web pages - articles, tables, code blocks',
    category: 'browser',
    requiresApproval: true,
    parameters: [
        { name: 'url', type: 'string', description: 'URL to scrape', required: true },
        { name: 'selector', type: 'string', description: 'CSS selector to target', required: false },
        { name: 'type', type: 'string', description: 'article|table|code|list|all', required: false, default: 'all' },
    ],
    handler: async (params, context) => {
        const url = params.url;
        const type = params.type || 'all';
        const result = await browseDefinition.handler({ url, extractText: true, extractLinks: false }, context);
        if (!result.success)
            return result;
        let output = result.output;
        const text = result.data?.text || '';
        // Extract code blocks
        if (type === 'code' || type === 'all') {
            const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
            if (codeBlocks.length > 0) {
                output += `\n\nCode blocks found: ${codeBlocks.length}\n`;
                codeBlocks.slice(0, 5).forEach((block, i) => {
                    output += `\n--- Block ${i + 1} ---\n${block.slice(0, 500)}${block.length > 500 ? '...' : ''}\n`;
                });
            }
        }
        // Extract tables (simplified)
        if (type === 'table' || type === 'all') {
            const tableRows = text.match(/\|[^\n]+\|/g) || [];
            if (tableRows.length > 0) {
                output += `\n\nTable data found:\n${tableRows.slice(0, 20).join('\n')}\n`;
            }
        }
        // Extract lists
        if (type === 'list' || type === 'all') {
            const listItems = text.match(/^[\s]*[-*•][\s]+.+$/gm) || [];
            if (listItems.length > 0) {
                output += `\n\nList items: ${listItems.length}\n${listItems.slice(0, 30).join('\n')}\n`;
            }
        }
        return { success: true, output, data: result.data };
    },
};
//# sourceMappingURL=scrape.js.map