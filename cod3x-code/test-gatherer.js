import fs from 'fs/promises';

console.log('🔍 Diagnostic Test\n');

// Load config
const configPath = './.cod3xrc';
const configContent = await fs.readFile(configPath, 'utf-8');
const config = JSON.parse(configContent);

console.log('✓ Config loaded');
console.log('  context.includePatterns:', config.context.includePatterns);
console.log('  context.excludePatterns:', config.context.excludePatterns);
console.log('');

// This is what the gatherer is trying to do
const include = config.context.include;  // This is UNDEFINED - the bug!
const exclude = config.context.exclude;  // This is UNDEFINED - the bug!

console.log('❌ Current broken code:');
console.log('  include =', include);
console.log('  exclude =', exclude);
console.log('  include is iterable?', Array.isArray(include));
console.log('');

console.log('✅ Fixed code should use:');
console.log('  include =', config.context.includePatterns);
console.log('  exclude =', config.context.excludePatterns);
console.log('  include is iterable?', Array.isArray(config.context.includePatterns));
