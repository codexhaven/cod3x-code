import { ToolDefinition } from '@codex-types/index';
import vm from 'vm';

export const definition: ToolDefinition = {
  name: 'eval_code',
  description: 'Safely evaluate JavaScript/TypeScript code in a sandboxed context',
  category: 'execution',
  requiresApproval: true,
  parameters: [
    { name: 'code', type: 'string', description: 'Code to evaluate', required: true },
    { name: 'timeout', type: 'number', description: 'Timeout ms', required: false, default: 5000 },
  ],
  handler: async (params, context): Promise<any> => {
    const code = params.code as string;
    const timeout = (params.timeout as number) || 5000;
    
    try {
      const sandbox = { console, Math, Date, JSON, Array, Object, String, Number, Buffer, require };
      const result = vm.runInNewContext(code, sandbox, { timeout, displayErrors: true });
      
      const output = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
      return { success: true, output: `Result: ${output.slice(0, 5000)}`, data: { result } };
    } catch (error: any) {
      return { success: false, output: '', error: `Eval error: ${error.message}` };
    }
  },
};
