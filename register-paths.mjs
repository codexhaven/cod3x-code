/**
 * ═══════════════════════════════════════════════════════════════
 * Node.js Runtime Path Resolver - Cod3x Code v4.0
 * Developed by CodexHaven
 * 
 * Resolves @/* path aliases in compiled dist/ code for plain Node.js
 * ═══════════════════════════════════════════════════════════════
 */

import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read tsconfig paths
const tsconfigPath = join(__dirname, 'tsconfig.json');
let pathMappings = {};

if (existsSync(tsconfigPath)) {
  try {
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
    const paths = tsconfig.compilerOptions?.paths || {};
    const baseUrl = tsconfig.compilerOptions?.baseUrl || '.';
    const basePath = resolve(__dirname, baseUrl);

    for (const [alias, targets] of Object.entries(paths)) {
      if (targets && targets.length > 0) {
        const cleanAlias = alias.replace('/*', '');
        const cleanTarget = resolve(basePath, targets[0].replace('/*', ''));
        pathMappings[cleanAlias] = cleanTarget;
      }
    }
  } catch (e) {
    console.error('Error reading tsconfig:', e.message);
  }
}

const originalResolve = createRequire(import.meta.url).resolve;

export async function resolve(specifier, context, nextResolve) {
  // Handle @/* imports
  if (specifier.startsWith('@')) {
    for (const [alias, targetPath] of Object.entries(pathMappings)) {
      if (specifier.startsWith(alias + '/')) {
        const subPath = specifier.slice(alias.length + 1);
        const resolvedPath = join(targetPath, subPath);
        
        // Try .js extension for compiled files
        const candidates = [resolvedPath, resolvedPath + '.js', resolvedPath + '/index.js'];
        for (const candidate of candidates) {
          if (existsSync(candidate)) {
            return { url: pathToFileURL(candidate).href, shortCircuit: true };
          }
        }
        
        // Fall back to URL format for Node.js to handle
        return { url: pathToFileURL(resolvedPath).href, shortCircuit: true };
      }
    }
  }

  return nextResolve(specifier, context);
}

export async function getFormat(url, context, nextGetFormat) {
  return nextGetFormat(url, context);
}

export async function transformSource(source, context, nextTransformSource) {
  return nextTransformSource(source, context);
}
