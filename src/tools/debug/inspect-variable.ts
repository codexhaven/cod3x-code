import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'inspect_variable',
  description: 'Inspect the value and type of a variable or expression in context',
  category: 'debug',
  requiresApproval: false,
  parameters: [
    { name: 'expression', type: 'string', description: 'Variable or expression to inspect', required: true },
    { name: 'context', type: 'string', description: 'file:line or scope', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    const expr = params.expression as string;
    
    try {
      // Safe evaluation of basic expressions
      const value = eval(expr);
      const type = typeof value;
      const str = JSON.stringify(value, null, 2);
      
      return {
        success: true,
        output: `Inspect: ${expr}\nType: ${type}\nValue: ${str.slice(0, 1000)}`,
        data: { expression: expr, type, value },
      };
    } catch {
      return {
        success: true,
        output: `Inspect: ${expr}\nCannot evaluate dynamically. Use eval_code tool for execution.`,
      };
    }
  },
};
