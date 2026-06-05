import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'click_element',
  description: 'Click an element on a page by selector (requires puppeteer)',
  category: 'browser',
  requiresApproval: true,
  parameters: [
    { name: 'url', type: 'string', description: 'Page URL', required: true },
    { name: 'selector', type: 'string', description: 'CSS selector to click', required: true },
    { name: 'waitFor', type: 'string', description: 'Selector to wait for after click', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    if (!context.platform.supportsPuppeteer) {
      return { success: false, output: '', error: 'Browser automation not supported on this platform' };
    }

    try {
      const puppeteer = await import('puppeteer-core') as any;
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();
      
      await page.goto(params.url as string, { waitUntil: 'networkidle2' });
      await page.click(params.selector as string);
      
      if (params.waitFor) {
        await page.waitForSelector(params.waitFor as string, { timeout: 10000 });
      }
      
      const content = await page.content();
      await browser.close();
      
      return { success: true, output: `Clicked ${params.selector}. Page content: ${content.slice(0, 2000)}...` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
