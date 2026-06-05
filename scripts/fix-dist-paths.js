#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 * Post-Build Path Fixer - Cod3x Code v4.0
 * Developed by CodexHaven
 * 
 * Rewrites @/* imports to relative paths in dist/ for Node.js compatibility
 * ═══════════════════════════════════════════════════════════════
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const PATH_MAP = {
  '@core/': './core/',
  '@tools/': './tools/',
  '@commands/': './commands/',
  '@agents/': './agents/',
  '@mcp/': './mcp/',
  '@ui/': './ui/',
  '@hooks/': './hooks/',
  '@memory/': './memory/',
  '@utils/': './utils/',
  '@config/': './config/',
  '@codex-types/': './types/',
  '@context/': './context/',
  '@llm/': './llm/',
  '@platform/': './platform/',
  '@swarm/': './swarm/',
};

async function* walkDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(fullPath);
    } else if (entry.name.endsWith('.js')) {
      yield fullPath;
    }
  }
}

async function fixFile(filePath) {
  let content = await fs.readFile(filePath, 'utf-8');
  const original = content;
  const fileDir = path.dirname(filePath);
  const relativeToRoot = path.relative(DIST, fileDir);
  const depth = relativeToRoot ? relativeToRoot.split(path.sep).length : 0;
  const prefix = depth === 0 ? './' : Array(depth).fill('..').join('/') + '/';

  // Replace @/ prefix with relative path
  content = content.replace(
    /from\s+['"](@[^'"]+)['"]|import\s+['"](@[^'"]+)['"]/g,
    (match, fromPath, importPath) => {
      const alias = fromPath || importPath;
      for (const [key, val] of Object.entries(PATH_MAP)) {
        if (alias.startsWith(key)) {
          const relativePath = prefix + val.replace(/^\.\//, '') + alias.slice(key.length);
          // Handle extension
          const resolved = fromPath
            ? `from '${relativePath}'`
            : `import '${relativePath}'`;
          return resolved;
        }
      }
      return match;
    }
  );

  if (content !== original) {
    await fs.writeFile(filePath, content, 'utf-8');
    const relPath = path.relative(DIST, filePath);
    console.log(`  ✓ Fixed: ${relPath}`);
    return true;
  }
  return false;
}

async function main() {
  console.log('🔧 Fixing dist/ import paths for Node.js compatibility...\n');
  
  let fixed = 0;
  try {
    for await (const file of walkDir(DIST)) {
      if (await fixFile(file)) fixed++;
    }
    console.log(`\n✅ Fixed ${fixed} files`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
