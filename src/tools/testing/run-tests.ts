import { ToolDefinition } from '@codex-types/index';
import { execSync } from 'child_process';

export const definition: ToolDefinition = {
  name: 'run_tests',
  description: 'Run tests for any framework with pattern filtering',
  category: 'testing',
  requiresApproval: false,
  parameters: [
    { name: 'path', type: 'string', description: 'Test path/pattern', required: false },
    { name: 'coverage', type: 'boolean', description: 'Run with coverage', required: false },
    { name: 'framework', type: 'string', description: 'jest|vitest|pytest|go-test', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    try {
      let cmd = '';
      const framework = params.framework as string | undefined;
      const testPath = params.path as string | undefined;
      
      if (framework === 'pytest' || (!framework && testPath?.endsWith('.py'))) {
        cmd = `pytest ${testPath || ''}${params.coverage ? ' --cov' : ''}`;
      } else if (framework === 'go-test') {
        cmd = `go test ${testPath || './...'}${params.coverage ? ' -cover' : ''}`;
      } else if (framework === 'vitest' || (!framework && testPath?.includes('vitest'))) {
        cmd = `npx vitest run ${testPath || ''}${params.coverage ? ' --coverage' : ''}`;
      } else {
        cmd = `npx jest ${testPath || ''}${params.coverage ? ' --coverage' : ''}`;
      }
      
      const output = execSync(cmd, { cwd: context.cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
      return { success: true, output: output || 'Tests passed' };
    } catch (error: any) {
      return { success: false, output: error.stdout?.toString() || '', error: error.stderr?.toString() || error.message };
    }
  },
};
