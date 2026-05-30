import chalk from 'chalk';
import readline from 'readline';

export class TerminalUI {
  constructor() {
    this.rl = null;
    this.history = [];
    this.historyIndex = -1;
  }
  
  init() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    
    this.setupHistoryNavigation();
  }
  
  setupHistoryNavigation() {
    if (this.rl) {
      this.rl.on('line', (line) => {
        if (line.trim()) {
          this.history.push(line);
          this.historyIndex = this.history.length;
        }
      });
    }
  }
  
  displayHeader(title = 'Cod3x-Code', version = '1.0.0') {
    console.clear();
    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ██████╗ ██████╗ ██████╗ ██╗  ██╗███████╗                        ║
║  ██╔════╝██╔═══██╗██╔══██╗╚██╗██╔╝╚══███╔╝                        ║
║  ██║     ██║   ██║██║  ██║ ╚███╔╝   ███╔╝                         ║
║  ██║     ██║   ██║██║  ██║ ██╔██╗  ███╔╝                          ║
║  ╚██████╗╚██████╔╝██████╔╝██╔╝ ██╗███████╗                        ║
║   ╚═════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝                        ║
║                                                                   ║
║                    ${title} v${version}                            ║
║              Complete Claude Code Alternative                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
    `));
  }
  
  displayMessage(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      ai: chalk.magenta
    };
    
    const icons = {
      info: 'ℹ',
      success: '✓',
      error: '✗',
      warning: '⚠',
      ai: '🤖'
    };
    
    const color = colors[type] || chalk.white;
    const icon = icons[type] || '•';
    
    console.log(color(`\n  ${icon} ${message}\n`));
  }
  
  displayThinking() {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    
    const interval = setInterval(() => {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(chalk.gray(`${frames[i++ % frames.length]} Thinking...`));
    }, 80);
    
    return interval;
  }
  
  displayResponse(text, isStreaming = false) {
    if (!isStreaming) {
      console.log(chalk.magenta('\n┌─[🤖 Cod3x]─────────────────────────────────────┐\n'));
    }
    
    const wrapped = this.wrapText(text, 68);
    for (const line of wrapped) {
      console.log(chalk.white(`  │ ${line}`));
    }
    
    if (!isStreaming) {
      console.log(chalk.magenta('\n└─────────────────────────────────────────────────┘\n'));
    }
  }
  
  displayToolCall(toolName, params) {
    console.log(chalk.cyan(`\n  🔧 ${toolName}:`));
    console.log(chalk.gray(`     ${JSON.stringify(params).slice(0, 100)}`));
  }
  
  displayToolResult(result) {
    if (result.success) {
      console.log(chalk.green(`     ✓ ${result.output?.slice(0, 100) || 'Completed'}\n`));
    } else {
      console.log(chalk.red(`     ✗ ${result.error}\n`));
    }
  }
  
  displayProgress(current, total, label = 'Processing') {
    const percent = (current / total) * 100;
    const barLength = 40;
    const filled = Math.round((barLength * current) / total);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(chalk.gray(`${label}: [${bar}] ${Math.round(percent)}%`));
    
    if (current === total) {
      process.stdout.write('\n');
    }
  }
  
  displayTable(headers, rows) {
    const colWidths = headers.map((h, i) => {
      const maxRow = Math.max(...rows.map(r => String(r[i]).length));
      return Math.max(h.length, maxRow);
    });
    
    // Header
    let headerLine = '┌';
    for (let i = 0; i < colWidths.length; i++) {
      headerLine += '─'.repeat(colWidths[i] + 2);
      if (i < colWidths.length - 1) headerLine += '┬';
    }
    headerLine += '┐';
    console.log(chalk.cyan(headerLine));
    
    let headerRow = '│';
    for (let i = 0; i < headers.length; i++) {
      headerRow += ` ${headers[i].padEnd(colWidths[i])} │`;
    }
    console.log(chalk.cyan(headerRow));
    
    let separator = '├';
    for (let i = 0; i < colWidths.length; i++) {
      separator += '─'.repeat(colWidths[i] + 2);
      if (i < colWidths.length - 1) separator += '┼';
    }
    separator += '┤';
    console.log(chalk.cyan(separator));
    
    // Rows
    for (const row of rows) {
      let rowLine = '│';
      for (let i = 0; i < row.length; i++) {
        rowLine += ` ${String(row[i]).padEnd(colWidths[i])} │`;
      }
      console.log(chalk.white(rowLine));
    }
    
    let footer = '└';
    for (let i = 0; i < colWidths.length; i++) {
      footer += '─'.repeat(colWidths[i] + 2);
      if (i < colWidths.length - 1) footer += '┴';
    }
    footer += '┘';
    console.log(chalk.cyan(footer));
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
  
  displayHelp(commands) {
    console.log(chalk.cyan('\n╔═══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║                         Available Commands                     ║'));
    console.log(chalk.cyan('╠═══════════════════════════════════════════════════════════════╣'));
    
    for (const [cmd, desc] of Object.entries(commands)) {
      console.log(chalk.white(`║  ${cmd.padEnd(15)} ${desc.padEnd(55)} ║`));
    }
    
    console.log(chalk.cyan('╚═══════════════════════════════════════════════════════════════╝\n'));
  }
  
  async confirm(question, defaultAnswer = false) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const suffix = defaultAnswer ? ' (Y/n) ' : ' (y/N) ';
    const answer = await new Promise(resolve => {
      rl.question(chalk.yellow(`${question}${suffix}`), resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() === 'y') return true;
    if (answer.toLowerCase() === 'n') return false;
    return defaultAnswer;
  }
  
  async prompt(question, defaultValue = '') {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const suffix = defaultValue ? ` (${defaultValue}) ` : ' ';
    const answer = await new Promise(resolve => {
      rl.question(chalk.cyan(`${question}${suffix}`), resolve);
    });
    
    rl.close();
    return answer || defaultValue;
  }
  
  clearScreen() {
    console.clear();
  }
  
  displayDivider() {
    console.log(chalk.gray('\n' + '─'.repeat(70) + '\n'));
  }
}

export default TerminalUI;
