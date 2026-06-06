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
    const depth = Math.max(0, path.relative(DIST, path.dirname(file)).split('/').length - 1);
    const prefix = depth === 0 ? './' : '../'.repeat(depth) + '/';

    // Fix @aliases
    for (const [alias, rel] of Object.entries(ALIASES)) {
        const regex = new RegExp(alias.replace('/', '\\/'), 'g');
        if (content.includes(alias)) {
            content = content.replace(regex, prefix + rel.slice(2));
            changed = true;
        }
    }

    // Fix missing .js extensions on ALL relative imports
    content = content.replace(
        /from\s+['"](\.[^'"]+)['"]/g,
        (match, p) => p.endsWith('.js') ? match : `from '${p}.js'`
    );

    if (content !== fs.readFileSync(file, 'utf8')) {
        fs.writeFileSync(file, content);
        count++;
    }
}
console.log(`✅ Fixed ${count} dist files`);
