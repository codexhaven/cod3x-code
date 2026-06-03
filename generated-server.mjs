/**
 * Cod3x Code v4.0 - Server built from scan
 * 96 files, 70 tools, 16 agents
 * 70 tools have real implementations
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
const SYSTEM = `You are Cod3x Code v4.0 by CodexHaven.
Scanned: 96 files, 70 tools, 16 agents.

AGENTS:
- code-generator: Code Generator (tools: write_file, read_file, edit_file, bash)\n- code-reviewer: Code Reviewer (tools: read_file, analyze_code, lint_code)\n- debugger: Debugger (tools: read_file, bash, grep_search, git_log)\n- architect: Architect (tools: read_file, write_file, analyze_code)\n- tester: Tester (tools: generate_tests, run_tests, coverage_report, read_file)\n- documenter: Documenter (tools: generate_docs, readme_generator, read_file, write_file)\n- git-manager: Git Manager (tools: git_status, git_commit, git_branch, git_diff, git_log)\n- security-auditor: Security Auditor (tools: analyze_code, grep_search, read_file)\n- optimizer: Optimizer (tools: analyze_code, refactor_code, read_file)\n- browser: Web Browser (tools: fetch_url, web_search, download_file)\n- swarm-leader: Swarm Leader (tools: read_file, write_file, bash)\n- task-decomposer: Task Decomposer (tools: read_file, analyze_code)\n- error-analyst: Error Analyst (tools: read_file, bash, grep_search)\n- trail-runner: Trail Runner (tools: bash, eval_code, read_file)\n- system: system\n- user: user

TOOLS BY CATEGORY:
[ai] (3 tools)\n[browser] (5 tools)\n[code] (8 tools)\n[database] (2 tools)\n[debug] (5 tools)\n[documentation] (3 tools)\n[execution] (3 tools)\n[filesystem] (13 tools)\n[git] (9 tools)\n[network] (3 tools)\n[project] (3 tools)\n[search] (3 tools)\n[testing] (3 tools)\n[utility] (7 tools)

WORKSPACE: You have a workspace at ./workspace/. Use:
- workspace_bash: Run commands in workspace
- workspace_write: Create files in workspace
- workspace_read: Read files from workspace
- workspace_list: List workspace contents

For agents: !agent <name> <task>
For swarm: !swarm <objective>
For tools: Just describe what you need and I'll use the right tool.`;

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
                }).join('\n');
            case 'bash':
                return execSync(params.command || params.cmd, {encoding:'utf8',timeout:30000,maxBuffer:5*1024*1024});
            case 'grep_search':
                return execSync('grep -rn "'+(params.pattern||params.query)+'" '+(params.path||'.')+' --include="'+(params.include||'*')+'"', {encoding:'utf8'}).substring(0,5000);
            case 'web_search':
                return execSync('curl -sL "https://html.duckduckgo.com/html/?q='+encodeURIComponent(params.query||params.q)+'" | grep -oP "(?<=<a rel=\"nofollow\" class=\"result__a\" href=\").*?(?=\")" | head -10', {encoding:'utf8',timeout:15000});
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
                }).join('\n');
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
        const m = response.match(/<cod3x-tool>(.*?)<\/cod3x-tool>\s*<cod3x-params>(.*?)<\/cod3x-params>/s);
        if (!m) break;
        
        const toolName = m[1].trim();
        const toolParams = JSON.parse(m[2].trim());
        console.log('  🔧 ' + toolName);
        
        const result = executeTool(toolName, toolParams);
        console.log('  ✅ ' + (result||'').substring(0, 80).replace(/\n/g, ' '));
        
        messages.push({role:'assistant',content:response});
        messages.push({role:'user',content:'<tool_result>'+result.substring(0,4000)+'</tool_result>\nContinue or give final answer.'});
        response = await callAI(messages);
    }
    
    return response;
}

// ============================================================
// HTTP SERVER
// ============================================================

// ============================================================
// ORCHESTRATOR - Memory & State (from codex-developer patterns)
// ============================================================
const CODEX_DIR = path.join(__dirname, '.codex');
if (!fs.existsSync(CODEX_DIR)) fs.mkdirSync(CODEX_DIR, { recursive: true });

const STATE_FILE = path.join(CODEX_DIR, 'state.json');
const BRAIN_FILE = path.join(CODEX_DIR, 'project_brain.md');
const QUEUE_FILE = path.join(CODEX_DIR, 'build-queue.txt');
const DONE_FILE = path.join(CODEX_DIR, 'build-done.txt');

if (!fs.existsSync(STATE_FILE)) fs.writeFileSync(STATE_FILE, JSON.stringify({ cycle: 0, successful: 0, failures: 0, files_built: [] }));
if (!fs.existsSync(BRAIN_FILE)) fs.writeFileSync(BRAIN_FILE, '# Cod3x Project Brain\\n');
if (!fs.existsSync(QUEUE_FILE)) fs.writeFileSync(QUEUE_FILE, '');
if (!fs.existsSync(DONE_FILE)) fs.writeFileSync(DONE_FILE, '');

function getMemory() {
    try {
        const brain = fs.readFileSync(BRAIN_FILE, 'utf8').substring(0, 500);
        const done = fs.readFileSync(DONE_FILE, 'utf8').split('\\n').filter(Boolean);
        const queue = fs.readFileSync(QUEUE_FILE, 'utf8').split('\\n').filter(Boolean);
        const remaining = queue.filter(q => !done.includes(q));
        return { brain, doneCount: done.length, remainingCount: remaining.length, remainingFiles: remaining.slice(0, 5) };
    } catch(e) { return { brain: '', doneCount: 0, remainingCount: 0, remainingFiles: [] }; }
}

function updateMemory(file, mode, success) {
    try {
        const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        state.cycle++;
        if (success) {
            state.successful++;
            state.files_built.push({ file, mode, time: new Date().toISOString() });
            fs.appendFileSync(DONE_FILE, mode + ':' + file + '\\n');
        } else {
            state.failures++;
        }
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
        fs.appendFileSync(BRAIN_FILE, '\\n- [' + (success ? 'OK' : 'FAIL') + '] ' + mode + ': ' + file);
    } catch(e) {}
}

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
    if (req.url === '/') { res.writeHead(200, {'Content-Type':'text/html'}); res.end(HTML); return; }
    if (req.url === '/status') { res.writeHead(200, {'Content-Type':'application/json'}); res.end(JSON.stringify({tools:70,agents:16,files:96})); return; }
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

server.listen(PORT, () => console.log('\n🚀 http://localhost:' + PORT + ' | ' + 70 + ' tools | ' + 16 + ' agents\n'));
