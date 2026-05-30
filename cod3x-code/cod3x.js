#!/usr/bin/env node

import { createInterface } from 'readline';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Cod3xCore extends EventEmitter {
  constructor() {
    super();
    this.state = {
      running: true,
      conversation: [],
      tools: new Map(),
      agents: new Map(),
      commands: new Map(),
      config: null,
      context: {
        project: null,
        files: [],
        git: null,
        dependencies: {}
      },
      tokenUsage: { total: 0, cost: 0 },
      startTime: Date.now()
    };
  }

  async initialize() {
    console.log(chalk.cyan('\n  ╔══════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('  ║                                                          ║'));
    console.log(chalk.cyan('  ║   ██████╗ ██████╗ ██████╗ ██╗  ██╗███████╗               ║'));
    console.log(chalk.cyan('  ║  ██╔════╝██╔═══██╗██╔══██╗╚██╗██╔╝╚══███╔╝               ║'));
    console.log(chalk.cyan('  ║  ██║     ██║   ██║██║  ██║ ╚███╔╝   ███╔╝                ║'));
    console.log(chalk.cyan('  ║  ██║     ██║   ██║██║  ██║ ██╔██╗  ███╔╝                 ║'));
    console.log(chalk.cyan('  ║  ╚██████╗╚██████╔╝██████╔╝██╔╝ ██╗███████╗               ║'));
    console.log(chalk.cyan('  ║   ╚═════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝               ║'));
    console.log(chalk.cyan('  ║                                                          ║'));
    console.log(chalk.cyan('  ║         Complete Claude Code Alternative                ║'));
    console.log(chalk.cyan('  ║              Production v1.0.0                          ║'));
    console.log(chalk.cyan('  ╚══════════════════════════════════════════════════════╝\n'));
    
    await this.loadConfig();
    await this.loadAllModules();
    await this.gatherProjectContext();
    this.displayStatus();
    this.startREPL();
  }

  async loadConfig() {
    const configPaths = [
      path.join(process.cwd(), '.cod3xrc'),
      path.join(process.env.HOME || process.env.USERPROFILE, '.cod3xrc'),
      path.join(__dirname, 'default.config.json')
    ];
    
    for (const configPath of configPaths) {
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        this.state.config = JSON.parse(content);
        console.log(chalk.green(`  ✓ Config: ${configPath}`));
        return;
      } catch (error) {
        // Continue to next path
      }
    }
    
    // Default configuration
    this.state.config = {
      permissions: { askBeforeBash: true, askBeforeWrite: true, askBeforeDelete: true },
      context: { maxFiles: 100, include: ['**/*.{js,py,go,rs,java,kt,ts,jsx,tsx}'], exclude: ['node_modules/**', '.git/**', 'dist/**'] },
      ai: { model: 'claude-3.5-sonnet', temperature: 0.7, maxTokens: 4096, provider: 'openrouter' },
      tools: { bash: { enabled: true, timeout: 30000 }, read: { enabled: true, maxSize: 10485760 } },
      mcp: { enabled: false, port: 8765 },
      logging: { level: 'info', file: 'logs/cod3x.log' }
    };
    console.log(chalk.yellow('  ⚠ Using default configuration'));
  }

  async loadAllModules() {
    // Load tools
    const toolNames = ['bash', 'read', 'write', 'edit', 'glob', 'grep', 'ls', 'notebook'];
    for (const name of toolNames) {
      try {
        const module = await import(`./tools/${name}.js`);
        this.state.tools.set(name, module);
        console.log(chalk.gray(`  🔧 Tool: ${name}`));
      } catch (error) {
        console.log(chalk.red(`  ✗ Failed to load tool: ${name}`));
      }
    }
    
    // Load agents
    const agentNames = ['code-agent', 'project-agent', 'git-agent'];
    for (const name of agentNames) {
      try {
        const module = await import(`./agents/${name}.js`);
        this.state.agents.set(name.replace('-agent', ''), module);
        console.log(chalk.gray(`  🤖 Agent: ${name}`));
      } catch (error) {}
    }
    
    // Load commands
    const commandNames = ['init', 'doctor', 'compact', 'cost', 'ide'];
    for (const name of commandNames) {
      try {
        const module = await import(`./commands/${name}.js`);
        this.state.commands.set(name, module);
      } catch (error) {}
    }
  }

  async gatherProjectContext() {
    console.log(chalk.gray('\n  📊 Gathering project context...'));
    
    // Get project name
    try {
      const pkg = await fs.readFile('package.json', 'utf-8');
      const data = JSON.parse(pkg);
      this.state.context.project = data.name || path.basename(process.cwd());
      this.state.context.dependencies = data.dependencies || {};
    } catch {
      this.state.context.project = path.basename(process.cwd());
    }
    
    // Scan files
    const { glob } = await import('glob');
    const include = this.state.config.context.includePatterns || this.state.config.context.include || [];
    const exclude = this.state.config.context.excludePatterns || this.state.config.context.exclude || [];
    
    const files = new Set();
    for (const pattern of include) {
      const matches = await glob(pattern, { ignore: exclude, nodir: true, absolute: false });
      matches.forEach(f => files.add(f));
    }
    this.state.context.files = Array.from(files).slice(0, this.state.config.context.maxFiles);
    
    // Git info
    try {
      const { execSync } = await import('child_process');
      const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
      if (branch) this.state.context.git = { branch };
    } catch {}
    
    console.log(chalk.green(`  ✓ Found ${this.state.context.files.length} files`));
    if (this.state.context.git) console.log(chalk.green(`  ✓ Git: ${this.state.context.git.branch}`));
  }

  displayStatus() {
    console.log(chalk.white('\n  ─────────────────────────────────────────────────────'));
    console.log(chalk.white(`  Project: ${chalk.yellow(this.state.context.project)}`));
    console.log(chalk.white(`  Tools: ${chalk.green(this.state.tools.size)} loaded`));
    console.log(chalk.white(`  Files: ${chalk.blue(this.state.context.files.length)} indexed`));
    console.log(chalk.white(`  Mode: ${chalk.cyan('interactive')}`));
    console.log(chalk.white('  ─────────────────────────────────────────────────────\n'));
    console.log(chalk.gray('  Type /help for commands, or just ask me anything.\n'));
  }

  startREPL() {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan(`┌─[${chalk.yellow(this.state.context.project)}]\n└─➤ `),
      terminal: true
    });
    
    rl.on('line', async (line) => {
      const input = line.trim();
      if (!input) {
        rl.prompt();
        return;
      }
      
      if (input === '/exit' || input === '/quit') {
        console.log(chalk.yellow('\n  👋 Goodbye! Have a great day!\n'));
        process.exit(0);
      } else if (input === '/help') {
        this.showHelp();
      } else if (input === '/clear') {
        console.clear();
        this.displayStatus();
      } else if (input === '/tools') {
        this.showTools();
      } else if (input === '/context') {
        this.showContext();
      } else if (input === '/stats') {
        this.showStats();
      } else if (input.startsWith('/')) {
        await this.handleCommand(input.slice(1));
      } else {
        await this.processUserInput(input);
      }
      
      rl.prompt();
    });
    
    rl.on('close', () => {
      process.exit(0);
    });
  }

  async processUserInput(input) {
    // Show thinking animation
    const spinChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    const spinner = setInterval(() => {
      process.stdout.write(`\r${chalk.gray(spinChars[i++ % spinChars.length] + ' Cod3x is thinking...')}`);
    }, 80);
    
    try {
      // Generate AI response using LLM proxy
      const { LLMProxy } = await import('./llm_proxy.js');
      const llm = new LLMProxy();
      await llm.initialize();
      
      const { SystemPrompt } = await import('./system-prompt.js');
      const promptBuilder = new SystemPrompt();
      
      const systemPrompt = promptBuilder.build(input, this.state.context, this.state.conversation.slice(-10));
      
      const response = await llm.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input }
      ]);
      
      clearInterval(spinner);
      process.stdout.write('\r\x1b[K');
      
      // Parse and execute tool calls
      const toolCalls = this.parseToolCalls(response);
      
      if (toolCalls.length > 0) {
        console.log(chalk.cyan('\n  🔧 Executing tools:\n'));
        const results = [];
        for (const call of toolCalls) {
          console.log(chalk.gray(`    → ${call.tool}: ${JSON.stringify(call.params).slice(0, 80)}`));
          const result = await this.executeTool(call);
          results.push(result);
          if (result.success) {
            console.log(chalk.green(`    ✓ Completed\n`));
          } else {
            console.log(chalk.red(`    ✗ Failed: ${result.error}\n`));
          }
        }
        
        // Get final response with tool results
        const finalPrompt = promptBuilder.buildWithToolResults(input, response, results);
        const finalResponse = await llm.chat([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input },
          { role: 'assistant', content: response },
          { role: 'user', content: `Tool results: ${JSON.stringify(results)}` }
        ]);
        
        this.displayResponse(finalResponse);
        this.state.conversation.push({ role: 'assistant', content: finalResponse, tools: toolCalls });
      } else {
        this.displayResponse(response);
        this.state.conversation.push({ role: 'assistant', content: response });
      }
      
      this.state.conversation.push({ role: 'user', content: input });
      this.state.tokenUsage.total += response.length;
      
    } catch (error) {
      clearInterval(spinner);
      process.stdout.write('\r\x1b[K');
      console.log(chalk.red(`\n  ✗ Error: ${error.message}\n`));
    }
  }

  parseToolCalls(response) {
    const calls = [];
    const regex = /<tool:(\w+)\s+([^>]+)>/g;
    let match;
    
    while ((match = regex.exec(response)) !== null) {
      const params = {};
      const paramRegex = /(\w+)="([^"]*?)"/g;
      let paramMatch;
      while ((paramMatch = paramRegex.exec(match[2])) !== null) {
        params[paramMatch[1]] = paramMatch[2];
      }
      calls.push({ tool: match[1], params, original: match[0] });
    }
    return calls;
  }

  async executeTool(call) {
    const tool = this.state.tools.get(call.tool);
    if (!tool) {
      return { success: false, error: `Unknown tool: ${call.tool}` };
    }
    
    try {
      const result = await tool.execute(call.params);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  displayResponse(response) {
    console.log(chalk.magenta('\n  ┌─[🤖 Cod3x]─────────────────────────────────────┐\n'));
    const wrapped = this.wrapText(response, 68);
    wrapped.forEach(line => console.log(chalk.white(`  │ ${line}`)));
    console.log(chalk.magenta('\n  └─────────────────────────────────────────────────┘\n'));
  }

  wrapText(text, width) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).length > width) {
        lines.push(current);
        current = word;
      } else {
        current += (current ? ' ' : '') + word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  async handleCommand(command) {
    const [cmd, ...args] = command.split(' ');
    
    if (this.state.commands.has(cmd)) {
      const mod = this.state.commands.get(cmd);
      if (mod.execute) await mod.execute(args);
    } else {
      console.log(chalk.red(`\n  Unknown command: ${cmd}. Type /help for available commands.\n`));
    }
  }

  showHelp() {
    console.log(chalk.cyan(`
  ╔══════════════════════════════════════════════════════════════╗
  ║                      Available Commands                      ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  /help          Show this help                               ║
  ║  /clear         Clear screen                                 ║
  ║  /exit          Exit Cod3x                                   ║
  ║  /tools         List available tools                         ║
  ║  /context       Show project context                         ║
  ║  /stats         Show usage statistics                        ║
  ║  /init          Initialize Cod3x in current project          ║
  ║  /doctor        Check system dependencies                    ║
  ║  /compact       Summarize conversation                       ║
  ║  /cost          Show token usage and cost                    ║
  ║  /ide           Launch external editor                       ║
  ╚══════════════════════════════════════════════════════════════╝
    `));
  }

  showTools() {
    console.log(chalk.cyan('\n  📦 Available Tools:\n'));
    for (const [name, tool] of this.state.tools) {
      console.log(chalk.yellow(`    ${name}`));
      console.log(chalk.gray(`      ${tool.metadata?.description || 'No description'}`));
    }
    console.log('');
  }

  showContext() {
    console.log(chalk.cyan('\n  📊 Project Context:\n'));
    console.log(chalk.white(`    Project: ${chalk.yellow(this.state.context.project)}`));
    console.log(chalk.white(`    Files: ${chalk.blue(this.state.context.files.length)}`));
    if (this.state.context.git) console.log(chalk.white(`    Git: ${chalk.green(this.state.context.git.branch)}`));
    console.log(chalk.white(`    Dependencies: ${Object.keys(this.state.context.dependencies).length}`));
    console.log('');
  }

  showStats() {
    const uptime = Math.floor((Date.now() - this.state.startTime) / 1000);
    console.log(chalk.cyan('\n  📈 Statistics:\n'));
    console.log(chalk.white(`    Uptime: ${chalk.yellow(Math.floor(uptime / 60))}m ${uptime % 60}s`));
    console.log(chalk.white(`    Messages: ${chalk.blue(this.state.conversation.length)}`));
    console.log(chalk.white(`    Tokens: ${chalk.magenta(this.state.tokenUsage.total.toLocaleString())}`));
    console.log(chalk.white(`    Cost: $${chalk.green(this.state.tokenUsage.cost.toFixed(4))}`));
    console.log('');
  }
}

// Main entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = new Cod3xCore();
  app.initialize().catch(error => {
    console.error(chalk.red(`\n  ✗ Fatal error: ${error.message}\n`));
    process.exit(1);
  });
}

export { Cod3xCore };
