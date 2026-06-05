import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'fill_form',
  description: 'Fill and submit a form on a web page (requires puppeteer)',
  category: 'browser',
  requiresApproval: true,
  parameters: [
    { name: 'url', type: 'string', description: 'Page URL', required: true },
    { name: 'fields', type: 'object', description: 'Field selector -> value map', required: true },
    { name: 'submitSelector', type: 'string', description: 'Submit button selector', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    if (!context.platform.supportsPuppeteer) {
      return { success: false, output: '', error: 'Form filling not supported on this platform' };
    }

    try {
      const puppeteer = await import('puppeteer-core') as any;
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();
      
      await page.goto(params.url as string, { waitUntil: 'networkidle2' });
      
      const fields = params.fields as Record<string, string>;
      for (const [selector, value] of Object.entries(fields)) {
        await page.type(selector, value);
      }
      
      if (params.submitSelector) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
          page.click(params.submitSelector as string),
        ]);
      }
      
      const url = page.url();
      const content = await page.content();
      await browser.close();
      
      return { success: true, output: `Form filled. Current URL: ${url}\nContent: ${content.slice(0, 2000)}...` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
