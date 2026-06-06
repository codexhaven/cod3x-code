export const definition = {
    name: 'screenshot_page',
    description: 'Take a screenshot of a web page (requires puppeteer)',
    category: 'browser',
    requiresApproval: true,
    parameters: [
        { name: 'url', type: 'string', description: 'URL to screenshot', required: true },
        { name: 'output', type: 'string', description: 'Output file path', required: true },
        { name: 'fullPage', type: 'boolean', description: 'Capture full page', required: false, default: true },
    ],
    handler: async (params, context) => {
        const url = params.url;
        const output = params.output;
        const fullPage = params.fullPage !== false;
        if (!context.platform.supportsPuppeteer) {
            return { success: false, output: '', error: 'Screenshots not supported on this platform (Termux/Android). Use browse_page instead.' };
        }
        try {
            const puppeteer = await import('puppeteer-core');
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            await page.screenshot({
                path: output,
                fullPage,
            });
            await browser.close();
            return { success: true, output: `Screenshot saved: ${output}` };
        }
        catch (error) {
            return { success: false, output: '', error: `Screenshot failed: ${error.message}. Make sure puppeteer is installed.` };
        }
    },
};
//# sourceMappingURL=screenshot.js.map