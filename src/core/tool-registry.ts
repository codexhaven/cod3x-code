/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Tool Registry - Cod3x Code v4.0
 * Developed by CodexHaven
 * 
 * 80+ tools across 14 categories with platform awareness
 * ═══════════════════════════════════════════════════════════════
 */

import { ToolDefinition, ToolRegistry as IToolRegistry, ToolResult, ToolContext } from '@codex-types/index';

// ─── Filesystem Tools (13) ───
import * as readFile from '@tools/filesystem/read';
import * as writeFile from '@tools/filesystem/write';
import * as editFile from '@tools/filesystem/edit';
import * as listDirectory from '@tools/filesystem/ls';
import * as globSearch from '@tools/filesystem/glob';
import * as grepSearch from '@tools/filesystem/grep';
import * as findFiles from '@tools/filesystem/find';
import * as copyFile from '@tools/filesystem/cp';
import * as moveFile from '@tools/filesystem/mv';
import * as removeFile from '@tools/filesystem/rm';
import * as statFile from '@tools/filesystem/stat';
import * as readJSON from '@tools/filesystem/read-json';
import * as writeJSON from '@tools/filesystem/write-json';

// ─── Execution Tools (3) ───
import * as bash from '@tools/execution/bash';
import * as spawn from '@tools/execution/spawn';
import * as evalCode from '@tools/execution/eval';

// ─── Git Tools (9) ───
import * as gitStatus from '@tools/git/status';
import * as gitCommit from '@tools/git/commit';
import * as gitBranch from '@tools/git/branch';
import * as gitDiff from '@tools/git/diff';
import * as gitLog from '@tools/git/log';
import * as gitCheckout from '@tools/git/checkout';
import * as gitStash from '@tools/git/stash';
import * as gitMerge from '@tools/git/merge';
import * as gitRemote from '@tools/git/remote';

// ─── Code Analysis Tools (8) ───
import * as analyzeCode from '@tools/code/analysis';
import * as lintCode from '@tools/code/lint';
import * as formatCode from '@tools/code/format';
import * as generateTests from '@tools/code/generate-tests';
import * as refactorCode from '@tools/code/refactor';
import * as countTokens from '@tools/code/count-tokens';
import * as extractImports from '@tools/code/extract-imports';
import * as findDeadCode from '@tools/code/find-dead-code';

// ─── Search Tools (3) ───
import * as searchCode from '@tools/search/search-code';
import * as semanticSearch from '@tools/search/semantic-search';
import * as fileSearch from '@tools/search/file-search';

// ─── Documentation Tools (3) ───
import * as generateDocs from '@tools/docs/generate-docs';
import * as updateChangelog from '@tools/docs/update-changelog';
import * as readmeGenerator from '@tools/docs/readme-generator';

// ─── Network Tools (3) ───
import * as fetchURL from '@tools/network/fetch';
import * as downloadFile from '@tools/network/download';
import * as webSearch from '@tools/network/web-search';

// ─── Database Tools (2) ───
import * as dbQuery from '@tools/database/query';
import * as dbMigrate from '@tools/database/migrate';

// ─── Testing Tools (3) ───
import * as runTests from '@tools/testing/run-tests';
import * as coverageReport from '@tools/testing/coverage';
import * as snapshotTest from '@tools/testing/snapshot';

// ─── Utility Tools (7) ───
import * as compress from '@tools/utils/compress';
import * as decompress from '@tools/utils/decompress';
import * as calculateHash from '@tools/utils/hash';
import * as notebook from '@tools/utils/notebook';
import * as clipboard from '@tools/utils/clipboard';
import * as envManager from '@tools/utils/env';
import * as parseData from '@tools/utils/parse';

// ─── Project Tools (3) ───
import * as projectInfo from '@tools/project/info';
import * as projectDeps from '@tools/project/dependencies';
import * as projectScripts from '@tools/project/scripts';

// ─── AI Tools (3) ───
import * as think from '@tools/ai/think';
import * as complexPrompt from '@tools/ai/complex-prompt';
import * as multiStep from '@tools/ai/multi-step';

// ─── Browser Tools (5) ───
import * as browsePage from '@tools/browser/browse';
import * as scrapeContent from '@tools/browser/scrape';
import * as screenshotPage from '@tools/browser/screenshot';
import * as clickElement from '@tools/browser/click';
import * as fillForm from '@tools/browser/fill-form';

// ─── Debug Tools (5) ───
import * as trailStart from '@tools/debug/trail-start';
import * as trailStop from '@tools/debug/trail-stop';
import * as setBreakpoint from '@tools/debug/set-breakpoint';
import * as inspectVariable from '@tools/debug/inspect-variable';
import * as stackTrace from '@tools/debug/stack-trace';

export class ToolRegistry implements IToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private context: ToolContext;

  constructor() {
    this.context = {
      cwd: process.cwd(),
      permissions: {
        ask: async () => ({ granted: true, permanent: false }),
        check: async () => true,
        addAutoApprove: () => {},
        addAutoDeny: () => {},
        clearCache: () => {},
      } as any,
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        fatal: () => {},
        logRequest: () => {},
        logToolCall: () => {},
        logAIResponse: () => {},
        logAgentCall: () => {},
        logSwarmEvent: () => {},
      } as any,
      config: {
        permissions: { allowedPaths: [process.cwd()], blockedCommands: [], autoDenyPatterns: [], autoApprovePatterns: [] },
        limits: { maxOutputSize: 50000, maxFileSize: 10485760, maxSearchResults: 200 },
      } as any,
      platform: { type: 'unknown', isTermux: false, isWindows: false, isMobile: false, homeDir: process.env.HOME || process.env.USERPROFILE || '/tmp', shell: process.env.SHELL || '/bin/bash', supportsPuppeteer: true } as any,
      llm: {
        id: 'fallback',
        name: 'Fallback',
        models: [],
        chat: async () => 'LLM not configured',
        stream: async () => 'LLM not configured',
        countTokens: (text: string) => Math.ceil(text.length / 4),
        isAvailable: async () => false,
      } as any,
    };
  }

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  unregister(name: string): void {
    this.tools.delete(name);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  listByCategory(category: string): ToolDefinition[] {
    return this.list().filter((tool) => tool.category === category);
  }

  async execute(name: string, params: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        output: '',
        error: `Unknown tool: ${name}. Available: ${this.list().map((t) => t.name).join(', ')}`,
      };
    }

    return tool.handler(params, this.context);
  }

  async loadDefaults(): Promise<void> {
    // Filesystem (13)
    this.register(readFile.definition);
    this.register(writeFile.definition);
    this.register(editFile.definition);
    this.register(listDirectory.definition);
    this.register(globSearch.definition);
    this.register(grepSearch.definition);
    this.register(findFiles.definition);
    this.register(copyFile.definition);
    this.register(moveFile.definition);
    this.register(removeFile.definition);
    this.register(statFile.definition);
    this.register(readJSON.definition);
    this.register(writeJSON.definition);

    // Execution (3)
    this.register(bash.definition);
    this.register(spawn.definition);
    this.register(evalCode.definition);

    // Git (9)
    this.register(gitStatus.definition);
    this.register(gitCommit.definition);
    this.register(gitBranch.definition);
    this.register(gitDiff.definition);
    this.register(gitLog.definition);
    this.register(gitCheckout.definition);
    this.register(gitStash.definition);
    this.register(gitMerge.definition);
    this.register(gitRemote.definition);

    // Code Analysis (8)
    this.register(analyzeCode.definition);
    this.register(lintCode.definition);
    this.register(formatCode.definition);
    this.register(generateTests.definition);
    this.register(refactorCode.definition);
    this.register(countTokens.definition);
    this.register(extractImports.definition);
    this.register(findDeadCode.definition);

    // Search (3)
    this.register(searchCode.definition);
    this.register(semanticSearch.definition);
    this.register(fileSearch.definition);

    // Documentation (3)
    this.register(generateDocs.definition);
    this.register(updateChangelog.definition);
    this.register(readmeGenerator.definition);

    // Network (3)
    this.register(fetchURL.definition);
    this.register(downloadFile.definition);
    this.register(webSearch.definition);

    // Database (2)
    this.register(dbQuery.definition);
    this.register(dbMigrate.definition);

    // Testing (3)
    this.register(runTests.definition);
    this.register(coverageReport.definition);
    this.register(snapshotTest.definition);

    // Utility (7)
    this.register(compress.definition);
    this.register(decompress.definition);
    this.register(calculateHash.definition);
    this.register(notebook.definition);
    this.register(clipboard.definition);
    this.register(envManager.definition);
    this.register(parseData.definition);

    // Project (3)
    this.register(projectInfo.definition);
    this.register(projectDeps.definition);
    this.register(projectScripts.definition);

    // AI (3)
    this.register(think.definition);
    this.register(complexPrompt.definition);
    this.register(multiStep.definition);

    // Browser (5)
    this.register(browsePage.definition);
    this.register(scrapeContent.definition);
    this.register(screenshotPage.definition);
    this.register(clickElement.definition);
    this.register(fillForm.definition);

    // Debug (5)
    this.register(trailStart.definition);
    this.register(trailStop.definition);
    this.register(setBreakpoint.definition);
    this.register(inspectVariable.definition);
    this.register(stackTrace.definition);
  }

  getCount(): number {
    return this.tools.size;
  }

  setContext(context: ToolContext): void {
    this.context = context;
  }
}

export default ToolRegistry;
