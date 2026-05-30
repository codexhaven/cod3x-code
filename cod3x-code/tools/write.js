import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function execute(params) {
  const { path: filePath, content, encoding = 'utf-8', overwrite = false, createBackup = true } = params;
  
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    
    // Security: Prevent writing outside project
    if (!absolutePath.startsWith(process.cwd())) {
      return { success: false, error: 'Security: Cannot write outside project directory' };
    }
    
    // Check if exists
    let exists = false;
    try {
      await fs.access(absolutePath);
      exists = true;
      
      if (overwrite !== 'true' && overwrite !== true) {
        return { 
          success: false, 
          error: `File already exists: ${filePath}. Use overwrite=true to replace`,
          exists: true
        };
      }
    } catch (error) {
      // File doesn't exist, that's fine
    }
    
    // Create backup
    let backupPath = null;
    if (exists && createBackup) {
      backupPath = `${absolutePath}.backup.${Date.now()}`;
      await fs.copyFile(absolutePath, backupPath);
    }
    
    // Create directory if needed
    const dir = path.dirname(absolutePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(absolutePath, content, { encoding, mode: 0o644 });
    
    // Calculate hash for change tracking
    const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
    
    return {
      success: true,
      output: `✓ Written ${content.split('\n').length} lines to ${filePath}`,
      path: filePath,
      size: content.length,
      lines: content.split('\n').length,
      hash: hash,
      backup: backupPath,
      overwritten: exists
    };
  } catch (error) {
    return {
      success: false,
      error: `Write failed: ${error.message}`,
      path: filePath
    };
  }
}

export const metadata = {
  name: 'write',
  description: 'Create or overwrite files with backup support',
  parameters: ['path', 'content', 'encoding', 'overwrite', 'createBackup'],
  requiresApproval: true,
  category: 'filesystem'
};
