import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'clipboard',
  description: 'Copy text to or paste from clipboard',
  category: 'utility',
  requiresApproval: false,
  parameters: [
    { name: 'action', type: 'string', description: 'copy|paste', required: true },
    { name: 'text', type: 'string', description: 'Text to copy', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      const clipboardy = await import('clipboardy');
      
      if (params.action === 'copy' && params.text) {
        await clipboardy.default.write(params.text as string);
        return { success: true, output: `Copied to clipboard: ${(params.text as string).slice(0, 50)}...` };
      } else if (params.action === 'paste') {
        const text = await clipboardy.default.read();
        return { success: true, output: `Clipboard: ${text.slice(0, 500)}`, data: { text } };
      }
      
      return { success: false, output: '', error: 'Invalid action' };
    } catch (error: any) {
      return { success: false, output: '', error: `Clipboard error: ${error.message}` };
    }
  },
};
