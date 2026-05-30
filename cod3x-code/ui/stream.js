import readline from 'readline';

export class StreamUI {
  constructor() {
    this.isStreaming = false;
    this.currentLine = '';
  }
  
  async streamResponse(responseGenerator, onComplete = null) {
    this.isStreaming = true;
    this.currentLine = '';
    
    console.log(chalk.magenta('\n┌─[🤖 Cod3x]─────────────────────────────────────┐\n'));
    process.stdout.write(chalk.white('  │ '));
    
    let fullResponse = '';
    
    for await (const chunk of responseGenerator) {
      fullResponse += chunk;
      process.stdout.write(chunk);
      
      // Handle line wrapping
      if (chunk === '\n') {
        process.stdout.write(chalk.white('  │ '));
      }
    }
    
    console.log(chalk.magenta('\n└─────────────────────────────────────────────────┘\n'));
    
    this.isStreaming = false;
    
    if (onComplete) {
      onComplete(fullResponse);
    }
    
    return fullResponse;
  }
  
  async streamTokens(llm, messages, onToken = null) {
    const stream = await llm.streamChat(messages);
    let fullResponse = '';
    
    for await (const token of stream) {
      fullResponse += token;
      if (onToken) {
        onToken(token);
      } else {
        process.stdout.write(token);
      }
    }
    
    return fullResponse;
  }
  
  animateProgress(duration, message = 'Processing') {
    const startTime = Date.now();
    const frames = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];
    let frame = 0;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const percent = Math.min(100, Math.round((elapsed / duration) * 100));
      const frameChar = frames[frame++ % frames.length];
      
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(chalk.gray(`${frameChar} ${message}... ${percent}%`));
      
      if (elapsed >= duration) {
        clearInterval(interval);
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
        console.log(chalk.green(`✓ ${message} complete`));
      }
    }, 50);
    
    return interval;
  }
  
  async typewriter(text, delay = 10) {
    for (const char of text) {
      process.stdout.write(char);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  clearLine() {
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);
  }
  
  displayCodeBlock(code, language = 'javascript') {
    console.log(chalk.gray(`\n\`\`\`${language}`));
    const lines = code.split('\n');
    for (const line of lines) {
      console.log(chalk.white(line));
    }
    console.log(chalk.gray('```\n'));
  }
  
  displayDiff(oldContent, newContent) {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];
      
      if (oldLine !== newLine) {
        if (oldLine) console.log(chalk.red(`- ${oldLine}`));
        if (newLine) console.log(chalk.green(`+ ${newLine}`));
      } else if (oldLine) {
        console.log(chalk.gray(`  ${oldLine}`));
      }
    }
  }
  
  displayTable(headers, rows) {
    const colWidths = headers.map((h, i) => {
      const maxRow = Math.max(...rows.map(r => String(r[i]).length));
      return Math.max(h.length, maxRow);
    });
    
    // Header
    let headerLine = '┌' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐';
    console.log(chalk.cyan(headerLine));
    
    let headerRow = '│' + headers.map((h, i) => ` ${h.padEnd(colWidths[i])} `).join('│') + '│';
    console.log(chalk.cyan(headerRow));
    
    let separator = '├' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤';
    console.log(chalk.cyan(separator));
    
    // Rows
    for (const row of rows) {
      let rowLine = '│' + row.map((r, i) => ` ${String(r).padEnd(colWidths[i])} `).join('│') + '│';
      console.log(chalk.white(rowLine));
    }
    
    let footer = '└' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘';
    console.log(chalk.cyan(footer));
  }
}

export default StreamUI;
