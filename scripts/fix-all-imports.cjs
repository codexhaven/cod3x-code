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
    const dir = path.dirname(file);
    const depth = Math.max(0, path.relative(DIST, dir).split(path.sep).filter(Boolean).length);
    const prefix = depth === 0 ? './' : '../'.repeat(depth) + '/';

    // Fix @aliases
    for (const [alias, rel] of Object.entries(ALIASES)) {
        const regex = new RegExp(alias.replace('/', '\\/'), 'g');
        if (content.includes(alias)) {
            content = content.replace(regex, prefix + rel.slice(2));
            changed = true;
        }
    }

    // Fix ALL local imports without .js extension
    // Matches: from './foo', from '../foo', from './foo/bar', import './foo'
    content = content.replace(
        /(from\s+['"])(\.[^'"]+?)(['"])/g,
        (match, start, p, end) => {
            if (p.endsWith('.js')) return match;
            return start + p + '.js' + end;
        }
    );
    // Also fix bare import statements: import './foo' -> import './foo.js'
    content = content.replace(
        /(import\s+['"])(\.[^'"]+?)(['"])/g,
        (match, start, p, end) => {
            if (p.endsWith('.js')) return match;
            return start + p + '.js' + end;
        }
    );

    if (content !== fs.readFileSync(file, 'utf8')) {
        fs.writeFileSync(file, content);
        count++;
        console.log('  Fixed: ' + path.relative(DIST, file));
    }
}
console.log('✅ Fixed ' + count + ' dist files');
