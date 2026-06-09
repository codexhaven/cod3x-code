#!/usr/bin/env node
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * ═══════════════════════════════════════════════════════════════
 * Cod3x Code v4.0 - Main Entry Point
 * Developed by CodexHaven - https://github.com/codexhaven/cod3x-code
 *
 * The Open-Source Claude Code Alternative
 * Production-ready AI coding assistant with swarm agents,
 * 80+ tools, multi-platform support, and browser capabilities.
 *
 * PORTABLE MODE: If a data/ directory exists alongside the executable,
 * all configs, logs, caches, and memory are redirected there.
 * ═══════════════════════════════════════════════════════════════
 */
// ─── PORTABLE MODE BOOTSTRAP (must be first) ───
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
// Detect portable mode by checking for data/ directory
const exeDir = path.dirname(fileURLToPath(import.meta.url));
const portableData = path.resolve(exeDir, '..', 'data');
try {
    if (fs.existsSync(portableData)) {
        process.env.COD3X_PORTABLE_ROOT = path.resolve(exeDir, '..');
        process.env.XDG_CONFIG_HOME = path.join(portableData, 'config');
        process.env.XDG_DATA_HOME = portableData;
        process.env.COD3X_HOME = portableData;
        process.env.HOME = portableData; // Prevents ~ expansion to host home
        process.env.USERPROFILE = portableData; // Windows
        process.env.TMPDIR = path.join(portableData, 'tmp');
        process.env.TEMP = path.join(portableData, 'tmp');
        process.env.TMP = path.join(portableData, 'tmp');
        process.env.NPM_CONFIG_CACHE = path.join(portableData, 'npm-cache');
        process.env.NPM_CONFIG_PREFIX = path.resolve(exeDir, '..', 'engine');
        // Ensure dirs exist
        fs.mkdirSync(path.join(portableData, 'config'), { recursive: true });
        fs.mkdirSync(path.join(portableData, 'memory'), { recursive: true });
        fs.mkdirSync(path.join(portableData, 'logs'), { recursive: true });
        fs.mkdirSync(path.join(portableData, 'tmp'), { recursive: true });
    }
}
catch { /* standard mode */ }
// ─── Load environment variables from portable or standard location ───
import dotenv from 'dotenv';
const envPath = process.env.COD3X_HOME
    ? path.join(process.env.COD3X_HOME, 'config', 'ai_settings.env')
    : path.join(os.homedir(), '.cod3x', 'ai_settings.env');
dotenv.config({ path: envPath });
import { render } from 'ink';
import { Command } from 'commander';
import chalk from 'chalk';
import { Cod3xApp } from './core/app.js';
import { ConfigLoader } from './config/loader.js';
import { ToolRegistry } from './core/tool-registry.js';
import { AgentOrchestrator } from './agents/orchestrator.js';
import { MCPManager } from './mcp/manager.js';
import { ConversationMemory } from './memory/conversation.js';
import { Logger } from './utils/logger.js';
import { PermissionManager } from './utils/permissions.js';
import { FileIndex } from './context/file-index.js';
import { PlatformDetector } from './platform/detector.js';
import { LLMProviderFactory } from './llm/provider.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const program = new Command();
program
    .name('cod3x')
    .description('Cod3x Code v4.0 by CodexHaven - AI coding assistant with 80+ tools, swarm agents, and multi-platform support')
    .version('4.0.0');
// ═══ Interactive Mode (Default) ═══
program
    .command('chat', { isDefault: true })
    .description('Start interactive chat session (default)')
    .option('-m, --model <model>', 'LLM model to use')
    .option('-p, --provider <provider>', 'LLM provider')
    .option('-t, --temperature <temp>', 'Temperature', parseFloat)
    .option('--no-stream', 'Disable streaming')
    .option('-s, --session <sessionId>', 'Resume a specific session ID')
    .action(async (options) => {
    try {
        const platformDetector = PlatformDetector.getInstance();
        const platformInfo = await platformDetector.detect();
        platformDetector.applyEnvironment(platformInfo);
        const configLoader = new ConfigLoader();
        const config = await configLoader.load();
        if (options.model)
            config.ai.model = options.model;
        if (options.provider)
            config.ai.provider = options.provider;
        if (options.temperature !== undefined)
            config.ai.temperature = options.temperature;
        if (options.stream === false)
            config.features.streaming = false;
        const logger = new Logger(config.logging);
        const permissions = new PermissionManager(config.permissions);
        const fileIndex = new FileIndex();
        const toolRegistry = new ToolRegistry();
        const memory = new ConversationMemory();
        const mcpManager = new MCPManager(config.mcp);
        const llmFactory = new LLMProviderFactory(config, logger);
        const agentOrchestrator = new AgentOrchestrator(config.agents, llmFactory.getPrimary(), logger, toolRegistry);
        // Initialize swarm if enabled
        if (config.features.swarmAgents) {
            agentOrchestrator.initializeSwarm(config.swarm);
        }
        await logger.initialize();
        await fileIndex.build(process.cwd(), config.context);
        await toolRegistry.loadDefaults();
        if (config.mcp.enabled) {
            await mcpManager.connectAll();
        }
        // Handle session resume if specified
        if (options.session) {
            const loaded = await memory.loadSession(options.session);
            if (!loaded) {
                console.error(chalk.yellow(`⚠ Session ${options.session} not found. Starting fresh session.`));
            }
            else {
                console.log(chalk.green(`✓ Resumed session: ${options.session} (${(await memory.getMessages()).length} messages)`));
            }
        }
        else {
            await memory.load();
        }
        // Check LLM availability
        const availability = await llmFactory.checkAvailability();
        const availableProviders = availability.filter(a => a.available);
        if (availableProviders.length === 0) {
            console.log(chalk.yellow('\n⚠️  No LLM providers available!'));
            console.log(chalk.gray('Install opencode-free-proxy for free AI access:'));
            console.log(chalk.cyan('  git clone https://github.com/sionex-code/opencode-proxy-api'));
            console.log(chalk.gray('\nOr set API keys in .env file\n'));
        }
        logger.info('Cod3x Code v4.0 started', {
            model: config.ai.model,
            provider: config.ai.provider,
            platform: platformInfo.type,
            tools: toolRegistry.list().length,
            agents: agentOrchestrator.getAgents().length,
            portable: configLoader.isPortable(),
        });
        console.log(chalk.green(`\n✨ Cod3x Code v4.0 by CodexHaven`));
        if (configLoader.isPortable()) {
            console.log(chalk.cyan(`📦 Portable Mode - All data stays in ./data/`));
        }
        console.log(chalk.gray(`Platform: ${platformInfo.type} | Tools: ${toolRegistry.list().length} | Agents: ${agentOrchestrator.getAgents().length}`));
        console.log(chalk.gray(`Type /help for commands\n`));
        render(_jsx(Cod3xApp, { config: config, logger: logger, permissions: permissions, toolRegistry: toolRegistry, fileIndex: fileIndex, memory: memory, mcpManager: mcpManager, agentOrchestrator: agentOrchestrator, llmFactory: llmFactory, platform: platformInfo }));
    }
    catch (error) {
        console.error(chalk.red('Fatal error:'), error);
        process.exit(1);
    }
});
// ═══ Non-Interactive Mode ═══
program
    .command('run')
    .description('Execute a single prompt (non-interactive/CI mode)')
    .argument('<prompt>', 'The prompt')
    .option('-m, --model <model>', 'Model')
    .option('-p, --provider <provider>', 'Provider')
    .option('--json', 'Output as JSON')
    .option('-o, --output <file>', 'Save to file')
    .action(async (prompt, options) => {
    try {
        const configLoader = new ConfigLoader();
        const config = await configLoader.load();
        if (options.model)
            config.ai.model = options.model;
        if (options.provider)
            config.ai.provider = options.provider;
        const { NonInteractiveRunner } = await import('./core/non-interactive');
        const runner = new NonInteractiveRunner(config);
        const result = await runner.execute(prompt);
        if (options.json) {
            console.log(JSON.stringify(result, null, 2));
        }
        else {
            console.log(result.output);
        }
        if (options.output) {
            const fs = await import('fs/promises');
            await fs.writeFile(options.output, result.output, 'utf-8');
        }
        process.exit(result.success ? 0 : 1);
    }
    catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
    }
});
// ═══ Init Command ═══
program
    .command('init')
    .description('Initialize Cod3x in current directory')
    .option('--force', 'Overwrite existing')
    .action(async (options) => {
    const configLoader = new ConfigLoader();
    if (options.force) {
        try {
            await (await import('fs/promises')).unlink(path.join(process.cwd(), '.cod3xrc'));
        }
        catch { /* ignore */ }
    }
    await configLoader.init();
});
// ═══ Doctor Command ═══
program
    .command('doctor')
    .description('Run diagnostics and check system')
    .action(async () => {
    const { doctorCommand } = await import('./commands/doctor');
    await doctorCommand.execute();
});
// ═══ Swarm Command ═══
program
    .command('swarm')
    .description('Execute with swarm agents')
    .argument('<objective>', 'Objective for the swarm')
    .option('-a, --agents <n>', 'Max concurrent agents', parseInt, 5)
    .option('-s, --strategy <strategy>', 'Strategy: parallel|sequential|priority', 'parallel')
    .action(async (objective, options) => {
    try {
        const configLoader = new ConfigLoader();
        const config = await configLoader.load();
        const { Logger } = await import('./utils/logger');
        const { ToolRegistry } = await import('./core/tool-registry');
        const { LLMProviderFactory } = await import('./llm/provider');
        const { AgentOrchestrator } = await import('./agents/orchestrator');
        const logger = new Logger(config.logging);
        const toolRegistry = new ToolRegistry();
        const llmFactory = new LLMProviderFactory(config, logger);
        const orchestrator = new AgentOrchestrator(config.agents, llmFactory.getPrimary(), logger, toolRegistry);
        await toolRegistry.loadDefaults();
        await logger.initialize();
        orchestrator.initializeSwarm({
            enabled: true,
            maxConcurrent: options.agents,
            strategy: options.strategy,
            timeout: 300000,
            retryAttempts: 3,
        });
        console.log(chalk.cyan(`🐝 Starting swarm: ${objective}`));
        const result = await orchestrator.executeSwarm(objective);
        console.log(chalk.green(`\n✅ Swarm complete (${result.duration}ms)`));
        console.log(result.output || result.summary);
        process.exit(result.success ? 0 : 1);
    }
    catch (error) {
        console.error(chalk.red('Swarm error:'), error);
        process.exit(1);
    }
});
// ═══ Agent Command ═══
program
    .command('agent')
    .description('Run a specific agent')
    .argument('<role>', 'Agent role')
    .argument('<task>', 'Task description')
    .option('-f, --files <files>', 'Files (comma-separated)')
    .action(async (role, task, options) => {
    try {
        const configLoader = new ConfigLoader();
        const config = await configLoader.load();
        const { Logger } = await import('./utils/logger');
        const { ToolRegistry } = await import('./core/tool-registry');
        const { LLMProviderFactory } = await import('./llm/provider');
        const { AgentOrchestrator } = await import('./agents/orchestrator');
        const logger = new Logger(config.logging);
        const toolRegistry = new ToolRegistry();
        const llmFactory = new LLMProviderFactory(config, logger);
        const runner = new AgentOrchestrator(config.agents, llmFactory.getPrimary(), logger, toolRegistry);
        await toolRegistry.loadDefaults();
        const files = options.files ? options.files.split(',') : undefined;
        const result = await runner.executeAgent(role, { id: `cli-${Date.now()}`, description: task, files });
        console.log(result.output || result.summary);
        process.exit(result.success ? 0 : 1);
    }
    catch (error) {
        console.error(chalk.red('Agent error:'), error);
        process.exit(1);
    }
});
// ═══ Tool Command ═══
program
    .command('tool')
    .description('Execute a specific tool')
    .argument('<name>', 'Tool name')
    .argument('[params]', 'JSON params')
    .action(async (name, params) => {
    const configLoader = new ConfigLoader();
    const config = await configLoader.load();
    const { ToolRegistry } = await import('./core/tool-registry');
    const registry = new ToolRegistry();
    await registry.loadDefaults();
    const result = await registry.execute(name, params ? JSON.parse(params) : {});
    console.log(JSON.stringify(result, null, 2));
});
// ═══ MCP Commands ═══
program
    .command('mcp')
    .description('MCP server management')
    .addCommand(new Command('list').description('List MCP servers').action(async () => {
    const { MCPManager } = await import('./mcp/manager');
    await new MCPManager().listServers();
}))
    .addCommand(new Command('add').description('Add MCP server').argument('<name>').argument('<url>').action(async (name, url) => {
    const { MCPManager } = await import('./mcp/manager');
    await new MCPManager().addServer(name, url);
}));
// ═══ Resume Session Command ═══
program
    .command('resume <sessionId>')
    .description('Resume a previous chat session')
    .option('-m, --model <model>', 'LLM model to use')
    .option('-p, --provider <provider>', 'LLM provider')
    .option('--no-stream', 'Disable streaming')
    .action(async (sessionId, options) => {
    try {
        const platformDetector = PlatformDetector.getInstance();
        const platformInfo = await platformDetector.detect();
        platformDetector.applyEnvironment(platformInfo);
        const configLoader = new ConfigLoader();
        const config = await configLoader.load();
        if (options.model)
            config.ai.model = options.model;
        if (options.provider)
            config.ai.provider = options.provider;
        if (options.stream === false)
            config.features.streaming = false;
        const logger = new Logger(config.logging);
        const permissions = new PermissionManager(config.permissions);
        const fileIndex = new FileIndex();
        const toolRegistry = new ToolRegistry();
        const memory = new ConversationMemory();
        const mcpManager = new MCPManager(config.mcp);
        const llmFactory = new LLMProviderFactory(config, logger);
        const agentOrchestrator = new AgentOrchestrator(config.agents, llmFactory.getPrimary(), logger, toolRegistry);
        if (config.features.swarmAgents) {
            agentOrchestrator.initializeSwarm(config.swarm);
        }
        await logger.initialize();
        await fileIndex.build(process.cwd(), config.context);
        await toolRegistry.loadDefaults();
        if (config.mcp.enabled) {
            await mcpManager.connectAll();
        }
        // Load the session
        const loaded = await memory.loadSession(sessionId);
        if (!loaded) {
            console.error(chalk.red(`✗ Session ${sessionId} not found.`));
            console.log(chalk.gray('Available sessions:'));
            const sessions = await memory.listSessions();
            if (sessions.length === 0) {
                console.log(chalk.gray('  (none)'));
            }
            else {
                sessions.forEach(s => console.log(chalk.gray(`  - ${s}`)));
            }
            process.exit(1);
        }
        console.log(chalk.green(`✓ Resumed session: ${sessionId} (${(await memory.getMessages()).length} messages)`));
        logger.info('Cod3x Code v4.0 resumed session', {
            sessionId,
            model: config.ai.model,
            provider: config.ai.provider,
            platform: platformInfo.type,
            portable: configLoader.isPortable(),
        });
        console.log(chalk.green(`\n✨ Cod3x Code v4.0 by CodexHaven`));
        if (configLoader.isPortable()) {
            console.log(chalk.cyan(`📦 Portable Mode - All data stays in ./data/`));
        }
        console.log(chalk.gray(`Platform: ${platformInfo.type} | Tools: ${toolRegistry.list().length} | Agents: ${agentOrchestrator.getAgents().length}`));
        console.log(chalk.gray(`Type /help for commands\n`));
        render(_jsx(Cod3xApp, { config: config, logger: logger, permissions: permissions, toolRegistry: toolRegistry, fileIndex: fileIndex, memory: memory, mcpManager: mcpManager, agentOrchestrator: agentOrchestrator, llmFactory: llmFactory, platform: platformInfo }));
    }
    catch (error) {
        console.error(chalk.red('Fatal error:'), error);
        process.exit(1);
    }
});
// ═══ Parse ═══
program.parse();
//# sourceMappingURL=main.js.map