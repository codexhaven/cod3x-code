// Fixes BOTH @aliases AND .js extensions in dist/
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const ALIASES = {
    '@core/': './core/', '@tools/': './tools/', '@agents/': './agents/',
    '@commands/': './commands/', '@mcp/': './mcp/', '@ui/': './ui/',
    '@hooks/': './hooks/', '@memory/': './memory/', '@utils/': './utils/',
    '@config/': './config/', '@codex-types/': './types/', '@context/': './context/',
    '@llm/': './llm/', '@platform/': './platform/', '@swarm/': './swarm/',
};

function walk(dir) {
    const files = [];
    for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) files.push(...walk(full));
        else if (item.endsWith('.js')) files.push(full);
    }
    return files;
}

let count = 0;
for (const file of walk(DIST)) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fix @aliases
    for (const [alias, rel] of Object.entries(ALIASES)) {
        if (content.includes(alias)) {
            const depth = path.relative(DIST, path.dirname(file)).split('/').length;
            const prefix = depth === 0 ? './' : '../'.repeat(depth);
            content = content.replace(new RegExp(alias.replace('/', '\\/'), 'g'), prefix + rel.slice(2));
            changed = true;
        }
    }

    // Fix .js extensions
    const fixed = content.replace(/from\s+['"](\.[^'"]+?)(?<!\.js)['"]/g, "from '$1.js'");
    if (fixed !== content) { content = fixed; changed = true; }

    if (changed) { fs.writeFileSync(file, content); count++; }
}
console.log(`Fixed ${count} dist files`);
