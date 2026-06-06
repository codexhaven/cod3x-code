/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Tool Registry - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * 80+ tools across 14 categories with platform awareness
 * ═══════════════════════════════════════════════════════════════
 */
// ─── Filesystem Tools (13) ───
import * as readFile from '../tools/filesystem/read.js';
import * as writeFile from '../tools/filesystem/write.js';
import * as editFile from '../tools/filesystem/edit.js';
import * as listDirectory from '../tools/filesystem/ls.js';
import * as globSearch from '../tools/filesystem/glob.js';
import * as grepSearch from '../tools/filesystem/grep.js';
import * as findFiles from '../tools/filesystem/find.js';
import * as copyFile from '../tools/filesystem/cp.js';
import * as moveFile from '../tools/filesystem/mv.js';
import * as removeFile from '../tools/filesystem/rm.js';
import * as statFile from '../tools/filesystem/stat.js';
import * as readJSON from '../tools/filesystem/read-json.js';
import * as writeJSON from '../tools/filesystem/write-json.js';
// ─── Execution Tools (3) ───
import * as bash from '../tools/execution/bash.js';
import * as spawn from '../tools/execution/spawn.js';
import * as evalCode from '../tools/execution/eval.js';
// ─── Git Tools (9) ───
import * as gitStatus from '../tools/git/status.js';
import * as gitCommit from '../tools/git/commit.js';
import * as gitBranch from '../tools/git/branch.js';
import * as gitDiff from '../tools/git/diff.js';
import * as gitLog from '../tools/git/log.js';
import * as gitCheckout from '../tools/git/checkout.js';
import * as gitStash from '../tools/git/stash.js';
import * as gitMerge from '../tools/git/merge.js';
import * as gitRemote from '../tools/git/remote.js';
// ─── Code Analysis Tools (8) ───
import * as analyzeCode from '../tools/code/analysis.js';
import * as lintCode from '../tools/code/lint.js';
import * as formatCode from '../tools/code/format.js';
import * as generateTests from '../tools/code/generate-tests.js';
import * as refactorCode from '../tools/code/refactor.js';
import * as countTokens from '../tools/code/count-tokens.js';
import * as extractImports from '../tools/code/extract-imports.js';
import * as findDeadCode from '../tools/code/find-dead-code.js';
// ─── Search Tools (3) ───
import * as searchCode from '../tools/search/search-code.js';
import * as semanticSearch from '../tools/search/semantic-search.js';
import * as fileSearch from '../tools/search/file-search.js';
// ─── Documentation Tools (3) ───
import * as generateDocs from '../tools/docs/generate-docs.js';
import * as updateChangelog from '../tools/docs/update-changelog.js';
import * as readmeGenerator from '../tools/docs/readme-generator.js';
// ─── Network Tools (3) ───
import * as fetchURL from '../tools/network/fetch.js';
import * as downloadFile from '../tools/network/download.js';
import * as webSearch from '../tools/network/web-search.js';
// ─── Database Tools (2) ───
import * as dbQuery from '../tools/database/query.js';
import * as dbMigrate from '../tools/database/migrate.js';
// ─── Testing Tools (3) ───
import * as runTests from '../tools/testing/run-tests.js';
import * as coverageReport from '../tools/testing/coverage.js';
import * as snapshotTest from '../tools/testing/snapshot.js';
// ─── Utility Tools (7) ───
import * as compress from '../tools/utils/compress.js';
import * as decompress from '../tools/utils/decompress.js';
import * as calculateHash from '../tools/utils/hash.js';
import * as notebook from '../tools/utils/notebook.js';
import * as clipboard from '../tools/utils/clipboard.js';
import * as envManager from '../tools/utils/env.js';
import * as parseData from '../tools/utils/parse.js';
// ─── Project Tools (3) ───
import * as projectInfo from '../tools/project/info.js';
import * as projectDeps from '../tools/project/dependencies.js';
import * as projectScripts from '../tools/project/scripts.js';
// ─── AI Tools (3) ───
import * as think from '../tools/ai/think.js';
import * as complexPrompt from '../tools/ai/complex-prompt.js';
import * as multiStep from '../tools/ai/multi-step.js';
// ─── Browser Tools (5) ───
import * as browsePage from '../tools/browser/browse.js';
import * as scrapeContent from '../tools/browser/scrape.js';
import * as screenshotPage from '../tools/browser/screenshot.js';
import * as clickElement from '../tools/browser/click.js';
import * as fillForm from '../tools/browser/fill-form.js';
// ─── Debug Tools (5) ───
import * as trailStart from '../tools/debug/trail-start.js';
import * as trailStop from '../tools/debug/trail-stop.js';
import * as setBreakpoint from '../tools/debug/set-breakpoint.js';
import * as inspectVariable from '../tools/debug/inspect-variable.js';
import * as stackTrace from '../tools/debug/stack-trace.js';
export class ToolRegistry {
    tools = new Map();
    context;
    constructor() {
        this.context = {
            cwd: process.cwd(),
            permissions: {
                ask: async () => ({ granted: true, permanent: false }),
                check: async () => true,
                addAutoApprove: () => { },
                addAutoDeny: () => { },
                clearCache: () => { },
            },
            logger: {
                debug: () => { },
                info: () => { },
                warn: () => { },
                error: () => { },
                fatal: () => { },
                logRequest: () => { },
                logToolCall: () => { },
                logAIResponse: () => { },
                logAgentCall: () => { },
                logSwarmEvent: () => { },
            },
            config: {
                permissions: { allowedPaths: [process.cwd()], blockedCommands: [], autoDenyPatterns: [], autoApprovePatterns: [] },
                limits: { maxOutputSize: 50000, maxFileSize: 10485760, maxSearchResults: 200 },
            },
            platform: { type: 'unknown', isTermux: false, isWindows: false, isMobile: false, homeDir: process.env.HOME || process.env.USERPROFILE || '/tmp', shell: process.env.SHELL || '/bin/bash', supportsPuppeteer: true },
            llm: {
                id: 'fallback',
                name: 'Fallback',
                models: [],
                chat: async () => 'LLM not configured',
                stream: async () => 'LLM not configured',
                countTokens: (text) => Math.ceil(text.length / 4),
                isAvailable: async () => false,
            },
        };
    }
    register(tool) {
        this.tools.set(tool.name, tool);
    }
    unregister(name) {
        this.tools.delete(name);
    }
    get(name) {
        return this.tools.get(name);
    }
    list() {
        return Array.from(this.tools.values());
    }
    listByCategory(category) {
        return this.list().filter((tool) => tool.category === category);
    }
    async execute(name, params) {
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
    async loadDefaults() {
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
    getCount() {
        return this.tools.size;
    }
    setContext(context) {
        this.context = context;
    }
}
export default ToolRegistry;
//# sourceMappingURL=tool-registry.js.map