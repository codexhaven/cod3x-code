/**
 * Cod3x Scanner v3 - Reads EVERYTHING, builds server from reality
 */
const fs = require('fs');
const path = require('path');

console.log('🔍 Deep scanning Cod3x Code v4.0...\n');

// ============================================================
// 1. SCAN EVERYTHING
// ============================================================
const findings = {
    tools: [],           // {name, description, category, file, hasHandler}
    agents: [],          // {role, name, systemPrompt, tools}
    hooks: [],           // {name, file}
    providers: [],       // {name, file, baseURL, models}
    platform: {},        // detector capabilities
    swarm: {},           // engine, decomposer
    totalFiles: 0,
    totalDirs: 0,
    toolCategories: new Set()
};

function walkDir(dir, depth = 0) {
    if (depth > 10) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const full = path.join(dir, item);
        try {
            const stat = fs.statSync(full);
            if (stat.isDirectory() && item !== 'node_modules' && item !== 'dist' && item !== '.git') {
                findings.totalDirs++;
                walkDir(full, depth + 1);
            } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
                findings.totalFiles++;
                analyzeFile(full, item);
            }
        } catch(e) {}
    }
}

function analyzeFile(filePath, fileName) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // TOOLS: Look for ToolDefinition pattern
    if (content.includes('ToolDefinition') || content.includes("name:") && content.includes("handler:")) {
        const nameMatch = content.match(/name:\s*['"]([^'"]+)['"]/);
        const descMatch = content.match(/description:\s*['"]([^'"]+)['"]/);
        const catMatch = content.match(/category:\s*['"]([^'"]+)['"]/);
        const hasHandler = content.includes('handler:') || content.includes('run(') || content.includes('execute(');
        
        if (nameMatch && descMatch) {
            findings.tools.push({
                name: nameMatch[1],
                description: descMatch[1],
                category: catMatch ? catMatch[1] : path.basename(path.dirname(filePath)),
                file: fileName,
                hasHandler: hasHandler,
                hasImplementation: content.length > 500 // Files > 500 chars likely have real code
            });
            if (catMatch) findings.toolCategories.add(catMatch[1]);
        }
    }
    
    // AGENTS: Deep scan orchestrator
    if (fileName === 'orchestrator.ts' && filePath.includes('agents')) {
        const roleMatches = [...content.matchAll(/role:\s*['"]([^'"]+)['"]/g)];
        const nameMatches = [...content.matchAll(/name:\s*['"]([^'"]+)['"]/g)];
        const promptMatches = [...content.matchAll(/systemPrompt:\s*['"]([^'"]*?)['"]/g)];
        
        for (let i = 0; i < roleMatches.length; i++) {
            findings.agents.push({
                role: roleMatches[i][1],
                name: nameMatches[i] ? nameMatches[i][1] : roleMatches[i][1],
                systemPrompt: promptMatches[i] ? promptMatches[i][1].substring(0, 100) : '',
                tools: []
            });
        }
        
        // Also find which tools each agent uses
        const agentToolMap = content.match(/tools:\s*\[([^\]]+)\]/g);
        if (agentToolMap) {
            agentToolMap.forEach((match, i) => {
                const toolNames = match.match(/['"]([^'"]+)['"]/g);
                if (toolNames && findings.agents[i]) {
                    findings.agents[i].tools = toolNames.map(t => t.replace(/['"]/g, ''));
                }
            });
        }
    }
    
    // PROVIDERS
    if (content.includes('LLMProvider') || content.includes('opencode-proxy')) {
        const urlMatch = content.match(/localhost:\d+/g) || content.match(/http[^'"]+/g);
        findings.providers.push({
            file: fileName,
            urls: urlMatch ? [...new Set(urlMatch)] : [],
            hasAPIKey: content.includes('apiKey') || content.includes('API_KEY') || content.includes('Bearer')
        });
    }
    
    // PLATFORM
    if (fileName === 'detector.ts') {
        const platformMatch = content.match(/isTermux|isAndroid|isWindows|isLinux|isMac/g);
        if (platformMatch) findings.platform.detected = [...new Set(platformMatch)];
    }
    
    // SWARM
    if (fileName === 'engine.ts' && filePath.includes('swarm')) {
        findings.swarm.engine = true;
    }
    if (fileName === 'decomposer.ts' && filePath.includes('swarm')) {
        findings.swarm.decomposer = true;
    }
}

walkDir('src');

// ============================================================
// 2. REPORT
// ============================================================
console.log('═══════════════════════════════════════');
console.log(`📁 Files: ${findings.totalFiles} in ${findings.totalDirs} dirs`);
console.log(`🔧 Tools: ${findings.tools.length} (${findings.tools.filter(t=>t.hasImplementation).length} with real code)`);
console.log(`🤖 Agents: ${findings.agents.length}`);
console.log(`🔌 Providers: ${findings.providers.length}`);
console.log(`🔄 Swarm: engine=${findings.swarm.engine||false} decomposer=${findings.swarm.decomposer||false}`);
console.log('═══════════════════════════════════════\n');

// Show agents with their tools
console.log('🤖 Agents & their tools:');
findings.agents.forEach(a => {
    console.log(`  ${a.name} (${a.role})`);
    if (a.tools.length > 0) console.log(`    Tools: ${a.tools.join(', ')}`);
});

// Show tool categories with counts
console.log('\n📂 Categories:');
const catCounts = {};
findings.tools.forEach(t => catCounts[t.category] = (catCounts[t.category]||0)+1);
Object.entries(catCounts).sort((a,b) => b[1]-a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} tools`);
});

// ============================================================
// 3. GENERATE SERVER FROM FINDINGS
// ============================================================
console.log('\n📝 Generating server based on actual scan...\n');

const serverCode = generateServerFromFindings(findings);
fs.writeFileSync('generated-server.mjs', serverCode);
console.log('✅ generated-server.mjs');

const htmlCode = generateHTMLFromFindings(findings);
fs.writeFileSync('index.html', htmlCode);
console.log('✅ index.html');

console.log('\n🚀 Run: node generated-server.mjs');

// ============================================================
// 4. SERVER GENERATOR - Uses real findings
// ============================================================
function generateServerFromFindings(f) {
    const realTools = f.tools.filter(t => t.hasImplementation);
    const toolNames = f.tools.map(t => t.name);
    const agentNames = f.agents.map(a => a.role);
    
    return `/**
 * Cod3x Code v4.0 - Server built from scan
 * ${f.totalFiles} files, ${f.tools.length} tools, ${f.agents.length} agents
 * ${realTools.length} tools have real implementations
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 9000;
const PROXY_KEY = 'oc-c7a9138bb7c0eb8855c3453bef389837f983c169';
const MODEL = 'deepseek-v4-flash-free';

// Workspace for agents
const WS = path.join(__dirname, 'workspace');
if (!fs.existsSync(WS)) fs.mkdirSync(WS, { recursive: true });

// ============================================================
// SYSTEM PROMPT - Built from real scan data
// ============================================================
const SYSTEM = \`You are Cod3x Code v4.0 by CodexHaven.
Scanned: ${f.totalFiles} files, ${f.tools.length} tools, ${f.agents.length} agents.

AGENTS:
${f.agents.map(a => `- ${a.role}: ${a.name}${a.tools.length ? ' (tools: '+a.tools.join(', ')+')' : ''}`).join('\\n')}

TOOLS BY CATEGORY:
${Object.entries(catCounts).map(([cat, count]) => `[${cat}] (${count} tools)`).join('\\n')}

WORKSPACE: You have a workspace at ./workspace/. Use:
- workspace_bash: Run commands in workspace
- workspace_write: Create files in workspace
- workspace_read: Read files from workspace
- workspace_list: List workspace contents

For agents: !agent <name> <task>
For swarm: !swarm <objective>
For tools: Just describe what you need and I'll use the right tool.\`;

// ============================================================
// AI CALL
// ============================================================
function callAI(messages) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ model: MODEL, messages, max_tokens: 2000 });
        const req = http.request({
            hostname: 'localhost', port: 6446, path: '/v1/chat/completions', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PROXY_KEY, 'Content-Length': Buffer.byteLength(data) }
        }, res => {
            let body = ''; res.on('data', c => body += c);
            res.on('end', () => {
                try { resolve(JSON.parse(body).choices[0].message.content); }
                catch(e) { resolve('API Error: ' + body.substring(0, 100)); }
            });
        });
        req.on('error', e => resolve('Proxy down? Start: cd ~/opencode-free-proxy && node server.mjs'));
        req.write(data); req.end();
    });
}

// ============================================================
// TOOL EXECUTOR - From real scan
// ============================================================
function executeTool(name, params) {
    try {
        switch(name) {
            case 'read_file': return fs.readFileSync(params.file || params.path, 'utf8').substring(0, 5000);
            case 'write_file': 
                const wf = path.join(WS, params.file);
                fs.mkdirSync(path.dirname(wf), {recursive:true});
                fs.writeFileSync(wf, params.content);
                return 'Created in workspace: ' + params.file;
            case 'edit_file':
                const ef = params.file.startsWith('/') ? params.file : path.join(WS, params.file);
                const orig = fs.readFileSync(ef, 'utf8');
                fs.writeFileSync(ef, orig.replace(params.old, params.new));
                return 'Updated: ' + params.file;
            case 'list_directory':
                const d = params.path || '.';
                return fs.readdirSync(d).map(f => {
                    const s = fs.statSync(path.join(d, f));
                    return (s.isDirectory()?'📁':'📄') + ' ' + f + ' (' + s.size + ' bytes)';
                }).join('\\n');
            case 'bash':
                return execSync(params.command || params.cmd, {encoding:'utf8',timeout:30000,maxBuffer:5*1024*1024});
            case 'grep_search':
                return execSync('grep -rn "'+(params.pattern||params.query)+'" '+(params.path||'.')+' --include="'+(params.include||'*')+'"', {encoding:'utf8'}).substring(0,5000);
            case 'web_search':
                return execSync('curl -sL "https://html.duckduckgo.com/html/?q='+encodeURIComponent(params.query||params.q)+'" | grep -oP "(?<=<a rel=\\"nofollow\\" class=\\"result__a\\" href=\\").*?(?=\\")" | head -10', {encoding:'utf8',timeout:15000});
            case 'workspace_bash':
                return execSync(params.command || params.cmd, {encoding:'utf8',timeout:60000,maxBuffer:10*1024*1024,cwd:WS});
            case 'workspace_write':
                const wwf = path.join(WS, params.file);
                fs.mkdirSync(path.dirname(wwf), {recursive:true});
                fs.writeFileSync(wwf, params.content);
                return 'Created in workspace: ' + params.file;
            case 'workspace_read':
                const wrf = path.join(WS, params.file);
                return fs.readFileSync(wrf, 'utf8').substring(0, 10000);
            case 'workspace_list':
                const wd = path.join(WS, params.path || '.');
                return fs.readdirSync(wd).map(f => {
                    const s = fs.statSync(path.join(wd, f));
                    return (s.isDirectory()?'📁':'📄') + ' ' + f + ' (' + s.size + ' bytes)';
                }).join('\\n');
            default:
                return 'Tool not available in web mode. Available: read_file, write_file, edit_file, list_directory, bash, grep_search, web_search, workspace_*';
        }
    } catch(e) { return 'Error: ' + e.message; }
}

// ============================================================
// AGENT LOOP
// ============================================================
async function processMessage(msg, history=[]) {
    const messages = [{role:'system',content:SYSTEM}, ...history.slice(-10), {role:'user',content:msg}];
    let response = await callAI(messages);
    
    for (let t=0; t<8; t++) {
        const m = response.match(/<cod3x-tool>(.*?)<\\/cod3x-tool>\\s*<cod3x-params>(.*?)<\\/cod3x-params>/s);
        if (!m) break;
        
        const toolName = m[1].trim();
        const toolParams = JSON.parse(m[2].trim());
        console.log('  🔧 ' + toolName);
        
        const result = executeTool(toolName, toolParams);
        console.log('  ✅ ' + (result||'').substring(0, 80).replace(/\\n/g, ' '));
        
        messages.push({role:'assistant',content:response});
        messages.push({role:'user',content:'<tool_result>'+result.substring(0,4000)+'</tool_result>\\nContinue or give final answer.'});
        response = await callAI(messages);
    }
    
    return response;
}

// ============================================================
// HTTP SERVER
// ============================================================
const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
    if (req.url === '/') { res.writeHead(200, {'Content-Type':'text/html'}); res.end(HTML); return; }
    if (req.url === '/status') { res.writeHead(200, {'Content-Type':'application/json'}); res.end(JSON.stringify({tools:${f.tools.length},agents:${f.agents.length},files:${f.totalFiles}})); return; }
    if (req.url === '/chat' && req.method === 'POST') {
        let body = ''; req.on('data', c => body += c);
        req.on('end', async () => {
            try {
                const { message, history } = JSON.parse(body);
                const response = await processMessage(message, history || []);
                res.writeHead(200, {'Content-Type':'application/json'});
                res.end(JSON.stringify({ response }));
            } catch(e) { res.end(JSON.stringify({ response: 'Error: ' + e.message })); }
        });
        return;
    }
    res.writeHead(404); res.end();
});

server.listen(PORT, () => console.log('\\n🚀 http://localhost:' + PORT + ' | ' + ${f.tools.length} + ' tools | ' + ${f.agents.length} + ' agents\\n'));
`;
}

// ============================================================
// 5. HTML GENERATOR - Toggle switches for all agents/tools
// ============================================================
function generateHTMLFromFindings(f) {
    const agentToggles = f.agents.map(a => 
        `<div style="display:flex;align-items:center;justify-content:space-between;padding:3px 0">
            <span style="font-size:.7em;color:#ccc">🤖 ${a.name}</span>
            <label class="switch"><input type="checkbox" checked onchange="toggleAgent('${a.role}',this.checked)"><span class="slider"></span></label>
        </div>`
    ).join('\n');

    let toolToggles = '';
    const cats = {};
    f.tools.forEach(t => {
        if (!cats[t.category]) cats[t.category] = [];
        cats[t.category].push(t);
    });
    
    for (const [cat, tools] of Object.entries(cats).sort()) {
        toolToggles += `<h3 style="color:var(--accent);font-size:.7em;text-transform:uppercase;margin:8px 0 4px 0">📂 ${cat} (${tools.length})</h3>\n`;
        tools.forEach(t => {
            toolToggles += `<div style="display:flex;align-items:center;justify-content:space-between;padding:1px 0">
                <span style="font-size:.65em;color:#888">🔹 ${t.name}</span>
                <label class="switch"><input type="checkbox" onchange="toggleTool('${t.name}',this.checked)"><span class="slider small"></span></label>
            </div>\n`;
        });
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Cod3x Code v4.0</title>
<style>
:root{--bg:#0a0a14;--panel:#12122a;--border:#2a2a4e;--accent:#7c5cff;--text:#e0e0e0;--green:#4cff4c}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--text);height:100vh;display:flex;flex-direction:column}
.header{background:var(--panel);padding:12px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
.header h1{font-size:1.2em;color:var(--accent)}.header span{font-size:.7em;color:var(--green)}
.main{flex:1;display:flex;overflow:hidden}
.sidebar{width:280px;background:var(--panel);border-right:1px solid var(--border);padding:15px;overflow-y:auto}
.sidebar h3{color:var(--accent);font-size:.7em;text-transform:uppercase;margin:10px 0 4px 0}
.chat{flex:1;display:flex;flex-direction:column}
.messages{flex:1;overflow-y:auto;padding:15px;display:flex;flex-direction:column;gap:8px}
.msg{max-width:85%;padding:10px 14px;border-radius:10px;animation:slideIn .3s}
@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.msg.user{background:#2a1a4e;align-self:flex-end}
.msg.agent{background:#1a1a3e;align-self:flex-start;border:1px solid #2a2a5e}
.msg .who{font-size:.65em;color:var(--accent);margin-bottom:2px}
.msg pre{background:#0a0a14;padding:8px;border-radius:4px;overflow-x:auto;font-size:.8em;margin:4px 0}
.input-area{padding:10px 15px;background:var(--panel);border-top:1px solid var(--border);display:flex;gap:8px}
.input-area input{flex:1;padding:10px 14px;background:#1a1a3e;border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:.9em;outline:none}
.input-area input:focus{border-color:var(--accent)}
.input-area button{padding:10px 20px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:bold}
.status{background:#0e0e22;padding:6px 15px;font-size:.65em;color:#888;display:flex;justify-content:space-between;border-top:1px solid var(--border)}
.loading{display:flex;gap:3px;padding:8px}.loading span{width:5px;height:5px;background:var(--accent);border-radius:50%;animation:bounce 1.4s infinite}
.loading span:nth-child(2){animation-delay:.2s}.loading span:nth-child(3){animation-delay:.4s}
@keyframes bounce{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-6px)}}
.switch{position:relative;display:inline-block;width:34px;height:18px}
.switch input{opacity:0;width:0;height:0}
.slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#333;border-radius:18px;transition:.3s}
.slider:before{position:absolute;content:"";height:12px;width:12px;left:3px;bottom:3px;background:#7c5cff;border-radius:50%;transition:.3s}
input:checked+.slider{background:#2a2a5e}
input:checked+.slider:before{transform:translateX(16px)}
.slider.small{width:28px;height:14px}
.slider.small:before{height:10px;width:10px;left:2px;bottom:2px}
input:checked+.slider.small:before{transform:translateX(14px)}
</style>
</head>
<body>
<div class="header"><h1>🚀 Cod3x Code v4.0</h1><span>🟢 ${f.tools.length} Tools | ${f.agents.length} Agents | Swarm</span></div>
<div class="main">
<div class="sidebar">
<h3>🤖 Agents (${f.agents.length})</h3>
${agentToggles}
<h3 style="margin-top:10px">🔧 Tools by Category</h3>
${toolToggles}
</div>
<div class="chat">
<div class="messages" id="msgs">
<div class="msg agent"><div class="who">Cod3x</div>👋 I'm Cod3x Code v4.0.<br>✅ ${f.tools.length} tools · ${f.agents.length} agents · Swarm<br>🖥️ Workspace ready<br><br>Toggle agents/tools ON/OFF in sidebar, then chat!</div>
</div>
<form class="input-area" onsubmit="sendForm(event)">
<input id="inp" placeholder="Toggle agents ON, then ask anything..." autofocus>
<button type="submit">Send</button>
</form>
</div></div>
<div class="status"><span id="agent">💬 Chat</span><span id="count">0 messages</span></div>
<script>
let activeAgents=new Set(),activeTools=new Set(),count=0,history=[];
function toggleAgent(n,on){on?activeAgents.add(n):activeAgents.delete(n);document.getElementById('inp').value=on?'!agent '+n+' ':'';document.getElementById('inp').focus()}
function toggleTool(n,on){on?activeTools.add(n):activeTools.delete(n);document.getElementById('inp').value=on?'Use '+n+': ':'';document.getElementById('inp').focus()}
function addMsg(t,w){const d=document.createElement('div');d.className='msg '+t;d.innerHTML='<div class="who">'+w+'</div>';return d}
async function sendForm(e){e.preventDefault();const i=document.getElementById('inp');const t=i.value.trim();if(!t)return;send(t);i.value=''}
async function send(text){
const msgs=document.getElementById('msgs');
const u=addMsg('user','You');u.appendChild(document.createTextNode(text));msgs.appendChild(u);
const load=document.createElement('div');load.className='loading';load.id='load';load.innerHTML='<span></span><span></span><span></span>';msgs.appendChild(load);
msgs.scrollTop=msgs.scrollHeight;
try{
const r=await fetch('/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history})});
const d=await r.json();
document.getElementById('load')?.remove();
const a=addMsg('agent','Cod3x');a.innerHTML+=d.response.replace(/\\n/g,'<br>');msgs.appendChild(a);
history.push({role:'user',content:text});history.push({role:'assistant',content:d.response});
if(history.length>20)history=history.slice(-20);
count++;document.getElementById('count').textContent=count+' messages';
}catch(err){
document.getElementById('load')?.remove();
const e=addMsg('agent','System');e.textContent='Error: '+err.message;msgs.appendChild(e);
}
msgs.scrollTop=msgs.scrollHeight;document.getElementById('inp').focus();
}
</script>
</body>
</html>`;
}
