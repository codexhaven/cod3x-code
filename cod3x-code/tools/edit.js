import fs from 'fs/promises';
import path from 'path';
import { diffLines } from 'diff';

export async function execute(params) {
  const { path: filePath, search, replace, regex = false, insertAt = null, deleteLines = null } = params;
  
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    const originalContent = await fs.readFile(absolutePath, 'utf-8');
    let newContent = originalContent;
    let changes = [];
    
    // Handle different edit operations
    if (deleteLines) {
      const [start, end] = deleteLines.split('-').map(Number);
      const lines = originalContent.split('\n');
      const deleted = lines.splice(start - 1, end - start + 1);
      newContent = lines.join('\n');
      changes.push(`Deleted lines ${deleteLines} (${deleted.length} lines)`);
    }
    else if (insertAt) {
      const lines = originalContent.split('\n');
      const insertLine = parseInt(insertAt) - 1;
      const insertContent = replace.split('\n');
      lines.splice(insertLine, 0, ...insertContent);
      newContent = lines.join('\n');
      changes.push(`Inserted ${insertContent.length} lines at line ${insertAt}`);
    }
    else if (regex === 'true' || regex === true) {
      const regexObj = new RegExp(search, 'g');
      const matches = originalContent.match(regexObj);
      newContent = originalContent.replace(regexObj, replace);
      changes.push(`Replaced ${matches?.length || 0} matches using regex`);
    }
    else {
      const occurrences = (originalContent.match(new RegExp(search, 'g')) || []).length;
      newContent = originalContent.replace(new RegExp(search, 'g'), replace);
      changes.push(`Replaced ${occurrences} occurrence(s) of "${search.slice(0, 50)}"`);
    }
    
    if (originalContent === newContent) {
      return {
        success: false,
        error: 'No changes made: pattern not found'
      };
    }
    
    // Generate unified diff
    const diff = diffLines(originalContent, newContent);
    const unifiedDiff = this.generateUnifiedDiff(diff, filePath);
    
    // Create backup
    const backupPath = `${absolutePath}.edit.backup.${Date.now()}`;
    await fs.copyFile(absolutePath, backupPath);
    
    // Write changes
    await fs.writeFile(absolutePath, newContent, 'utf-8');
    
    return {
      success: true,
      output: `✓ Edited ${filePath}\n\nChanges:\n${unifiedDiff.slice(0, 2000)}${unifiedDiff.length > 2000 ? '\n... (truncated)' : ''}`,
      diff: unifiedDiff,
      changes: changes,
      backup: backupPath,
      originalSize: originalContent.length,
      newSize: newContent.length
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: false, error: `File not found: ${filePath}` };
    }
    return { success: false, error: `Edit failed: ${error.message}` };
  }
}

function generateUnifiedDiff(diff, filePath) {
  const header = `--- a/${filePath}\n+++ b/${filePath}\n`;
  const changes = diff.map(part => {
    const prefix = part.added ? '+' : (part.removed ? '-' : ' ');
    return part.value.split('\n').map(line => `${prefix}${line}`).join('\n');
  }).join('\n');
  return header + changes;
}

export const metadata = {
  name: 'edit',
  description: 'Edit files with pattern replacement, line insertion, or deletion',
  parameters: ['path', 'search', 'replace', 'regex', 'insertAt', 'deleteLines'],
  requiresApproval: true,
  category: 'filesystem'
};
