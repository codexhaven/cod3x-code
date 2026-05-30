import chalk from 'chalk';
import { diffLines, diffWords, diffJson } from 'diff';

export class DiffView {
  static showLineDiff(oldStr, newStr, context = 3) {
    const changes = diffLines(oldStr, newStr);
    let lineNumber = 1;
    let oldLineNumber = 1;
    let newLineNumber = 1;
    
    console.log(chalk.cyan('\n  Diff:\n'));
    
    for (const part of changes) {
      const lines = part.value.split('\n');
      
      if (part.added) {
        for (const line of lines) {
          if (line) console.log(chalk.green(`  + ${newLineNumber++} │ ${line}`));
        }
      } else if (part.removed) {
        for (const line of lines) {
          if (line) console.log(chalk.red(`  - ${oldLineNumber++} │ ${line}`));
        }
      } else {
        // Show context
        const showLines = lines.slice(0, context);
        for (const line of showLines) {
          if (line) console.log(chalk.gray(`    ${lineNumber++} │ ${line}`));
        }
        if (lines.length > context * 2) {
          console.log(chalk.gray(`  ... (${lines.length - context * 2} lines omitted)`));
          lineNumber += lines.length - context * 2;
          oldLineNumber += lines.length - context * 2;
          newLineNumber += lines.length - context * 2;
          const lastLines = lines.slice(-context);
          for (const line of lastLines) {
            if (line) console.log(chalk.gray(`    ${lineNumber++} │ ${line}`));
          }
        } else {
          for (let i = context; i < lines.length; i++) {
            if (lines[i]) console.log(chalk.gray(`    ${lineNumber++} │ ${lines[i]}`));
          }
        }
        oldLineNumber = lineNumber;
        newLineNumber = lineNumber;
      }
    }
  }
  
  static showWordDiff(oldStr, newStr) {
    const changes = diffWords(oldStr, newStr);
    let output = '';
    
    for (const part of changes) {
      if (part.added) {
        output += chalk.green(part.value);
      } else if (part.removed) {
        output += chalk.red(part.value);
      } else {
        output += chalk.gray(part.value);
      }
    }
    
    console.log(chalk.cyan('\n  Word diff:\n'));
    console.log(`  ${output}\n`);
  }
  
  static showJsonDiff(oldObj, newObj) {
    const changes = diffJson(oldObj, newObj);
    
    console.log(chalk.cyan('\n  JSON diff:\n'));
    
    for (const part of changes) {
      if (part.added) {
        console.log(chalk.green(`  + ${part.value.trim()}`));
      } else if (part.removed) {
        console.log(chalk.red(`  - ${part.value.trim()}`));
      } else {
        console.log(chalk.gray(`    ${part.value.trim()}`));
      }
    }
  }
  
  static showUnifiedDiff(oldStr, newStr, filePath = 'file') {
    const changes = diffLines(oldStr, newStr);
    let oldLine = 1;
    let newLine = 1;
    
    console.log(chalk.cyan(`\n  --- a/${filePath}`));
    console.log(chalk.cyan(`  +++ b/${filePath}\n`));
    
    for (const part of changes) {
      if (part.added) {
        const lines = part.value.split('\n');
        for (const line of lines) {
          if (line) console.log(chalk.green(`  +${line}`));
        }
        newLine += lines.length;
      } else if (part.removed) {
        const lines = part.value.split('\n');
        for (const line of lines) {
          if (line) console.log(chalk.red(`  -${line}`));
        }
        oldLine += lines.length;
      } else {
        const lines = part.value.split('\n');
        const maxLines = Math.min(lines.length, 3);
        for (let i = 0; i < maxLines; i++) {
          if (lines[i]) console.log(chalk.gray(`   ${lines[i]}`));
        }
        if (lines.length > 6) {
          console.log(chalk.gray(`  @@ -${oldLine},${lines.length} +${newLine},${lines.length} @@`));
        }
        oldLine += lines.length;
        newLine += lines.length;
      }
    }
  }
  
  static showSideBySide(oldStr, newStr, width = 40) {
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    console.log(chalk.cyan('\n  Side-by-side diff:\n'));
    console.log(chalk.cyan(`  ${'Original'.padEnd(width)} │ ${'Modified'.padEnd(width)}`));
    console.log(chalk.gray(`  ${'─'.repeat(width)}─┼─${'─'.repeat(width)}`));
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';
      
      const oldDisplay = oldLine.length > width ? oldLine.slice(0, width - 3) + '...' : oldLine;
      const newDisplay = newLine.length > width ? newLine.slice(0, width - 3) + '...' : newLine;
      
      if (oldLine !== newLine) {
        console.log(chalk.red(`  ${oldDisplay.padEnd(width)} │ `) + chalk.green(`${newDisplay}`));
      } else {
        console.log(chalk.gray(`  ${oldDisplay.padEnd(width)} │ ${newDisplay}`));
      }
    }
  }
  
  static showSummary(changes) {
    let additions = 0;
    let deletions = 0;
    
    for (const change of changes) {
      if (change.added) additions += change.value.split('\n').length;
      if (change.removed) deletions += change.value.split('\n').length;
    }
    
    console.log(chalk.cyan('\n  Summary:'));
    console.log(chalk.green(`    + ${additions} additions`));
    console.log(chalk.red(`    - ${deletions} deletions`));
    console.log(chalk.gray(`    ~ ${additions + deletions} total changes\n`));
  }
  
  static async interactiveDiff(oldStr, newStr) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const changes = diffLines(oldStr, newStr);
    let currentIndex = 0;
    
    const displayChange = () => {
      if (currentIndex >= changes.length) {
        console.log(chalk.green('\n  ✓ Review complete\n'));
        rl.close();
        return;
      }
      
      const change = changes[currentIndex];
      console.log(chalk.cyan(`\n  Change ${currentIndex + 1}/${changes.length}:\n`));
      
      if (change.added) {
        console.log(chalk.green(`  + ${change.value.trim()}`));
      } else if (change.removed) {
        console.log(chalk.red(`  - ${change.value.trim()}`));
      } else {
        console.log(chalk.gray(`    ${change.value.trim()}`));
      }
      
      rl.question(chalk.yellow('\n  [n]ext, [p]revious, [a]ccept, [r]eject, [q]uit: '), (answer) => {
        switch(answer.toLowerCase()) {
          case 'n':
          case '':
            currentIndex++;
            displayChange();
            break;
          case 'p':
            currentIndex = Math.max(0, currentIndex - 1);
            displayChange();
            break;
          case 'a':
            // Accept this change
            currentIndex++;
            displayChange();
            break;
          case 'r':
            // Reject this change (remove it)
            changes.splice(currentIndex, 1);
            displayChange();
            break;
          case 'q':
            console.log(chalk.yellow('\n  Diff review cancelled\n'));
            rl.close();
            break;
          default:
            displayChange();
        }
      });
    };
    
    displayChange();
    
    return new Promise((resolve) => {
      rl.on('close', () => {
        resolve(changes);
      });
    });
  }
}

export default DiffView;
