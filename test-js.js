    let currentTab = 'chat';
    let activeTools = new Set();
    let activeAgents = new Set();
    let isLoading = false;

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        currentTab = tab.dataset.tab;
      });
    });

    async function api(method, endpoint, body) {
      const opts = { method, headers: {} };
      if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
      const res = await fetch('/api/' + endpoint, opts);
      return res.json();
    }

    async function loadStatus() {
      try {
        const { data } = await api('GET', 'status');
        document.getElementById('status-badge').textContent = data.llm.available.length > 0 ? 'Ready' : 'No LLM';
        document.getElementById('status-badge').className = 'badge ' + (data.llm.available.length > 0 ? 'green' : 'yellow');
        document.getElementById('tools-count').textContent = 'Tools: ' + data.tools;
        document.getElementById('agents-count').textContent = 'Agents: ' + data.agents;
        document.getElementById('llm-info').textContent = data.llm.model + ' (' + data.llm.provider + ')';
      } catch(e) {}
    }

    async function loadTools() {
      try {
        const { data } = await api('GET', 'tools');
        const list = document.getElementById('tools-list');
        const grid = document.getElementById('tools-grid');
        list.innerHTML = '';
        grid.innerHTML = '';
        document.getElementById('tools-toggle-count').textContent = '(' + data.count + ')';

        data.tools.forEach(tool => {
activeTools.add(tool.name);

// Sidebar toggle
const div = document.createElement('div');
div.className = 'toggle-switch';
div.innerHTML = `
  <div>
    <div class="label">
      <span>\${icons[tool.category] || '🔧'}</span>
      \${tool.name}
    </div>
    <div class="desc">\${tool.category}</div>
  </div>
  <div class="toggle active" data-tool="\${tool.name}"></div>
`;
div.querySelector('.toggle').addEventListener('click', function(e) {
  e.stopPropagation();
  this.classList.toggle('active');
  if (this.classList.contains('active')) activeTools.add(tool.name);
  else activeTools.delete(tool.name);
});
list.appendChild(div);

// Grid card
const card = document.createElement('div');
card.className = 'card';
card.innerHTML = `
  <div class="card-title">\${icons[tool.category] || '🔧'} \${tool.name}</div>
  <div class="card-desc">\${tool.description}</div>
  <div class="card-meta">
    <span>\${tool.category}</span>
    <span>\${tool.requiresApproval ? '⚠️ requires approval' : '✓ auto'}</span>
  </div>
`;
grid.appendChild(card);
        });
      } catch(e) { console.error('Failed to load tools:', e); }
    }

    const icons = {
      filesystem: '📁', execution: '⚡', git: '🌿', code: '💻',
      search: '🔍', network: '🌐', browser: '🖼️', debug: '🐛',
      ai: '🧠', project: '📦', testing: '✅', utility: '🛠️',
      documentation: '📚', database: '🗄️',
    };

    async function loadAgents() {
      try {
        const { data } = await api('GET', 'agents');
        const list = document.getElementById('agents-list');
        const grid = document.getElementById('agents-grid');
        list.innerHTML = '';
        grid.innerHTML = '';
        document.getElementById('agents-toggle-count').textContent = '(' + data.count + ')';

        data.agents.forEach(agent => {
activeAgents.add(agent.id);

// Sidebar toggle
const div = document.createElement('div');
div.className = 'toggle-switch';
div.innerHTML = `
  <div>
    <div class="label">🤖 \${agent.name}</div>
    <div class="desc">\${agent.role}</div>
  </div>
  <div class="toggle active" data-agent="\${agent.id}"></div>
`;
div.querySelector('.toggle').addEventListener('click', function(e) {
  e.stopPropagation();
  this.classList.toggle('active');
  if (this.classList.contains('active')) activeAgents.add(agent.id);
  else activeAgents.delete(agent.id);
});
list.appendChild(div);

// Grid card
const card = document.createElement('div');
card.className = 'card';
card.innerHTML = `
  <div class="card-title">🤖 \${agent.name}</div>
  <div class="card-desc">\${agent.description}</div>
  <div class="card-meta">
    <span>\${agent.role}</span>
    <span>\${agent.tools.length} tools</span>
  </div>
`;
grid.appendChild(card);
        });
      } catch(e) { console.error('Failed to load agents:', e); }
    }

    async function loadConfig() {
      try {
        const { data } = await api('GET', 'config');
        const container = document.getElementById('settings-content');
        container.innerHTML = `
<div class="settings-group">
  <div class="settings-label">Project</div>
  <input class="settings-input" value="\${data.name}" readonly>
</div>
<div class="settings-group">
  <div class="settings-label">Model</div>
  <input class="settings-input" value="\${data.model}" readonly>
</div>
<div class="settings-group">
  <div class="settings-label">Provider</div>
  <input class="settings-input" value="\${data.provider}" readonly>
</div>
<div class="settings-group">
  <div class="settings-label">Temperature</div>
  <input class="settings-input" value="\${data.temperature}" readonly>
</div>
<div class="settings-group">
  <div class="settings-label">Max Tokens</div>
  <input class="settings-input" value="\${data.maxTokens}" readonly>
</div>
<div class="settings-group">
  <div class="settings-label">Platform</div>
  <input class="settings-input" value="\${data.platform}" readonly>
</div>
<div class="settings-group">
  <div class="settings-label">Features</div>
  <div style="font-size: 12px; color: var(--text-dim);">
    \${Object.entries(data.features).map(([k,v]) => `<div>\${k}: \${v ? '✅' : '❌'}</div>`).join('')}
  </div>
</div>
        `;
      } catch(e) {}
    }

    function addMessage(role, content) {
      const area = document.getElementById('chat-messages');
      const div = document.createElement('div');
      div.className = 'message ' + role;
      div.innerHTML = `
        <div class="message-role">\${role === 'user' ? 'You' : role === 'assistant' ? 'Cod3x by CodexHaven' : 'System'}</div>
        <div class="message-bubble"></div>
      `;
      div.querySelector('.message-bubble').textContent = content;
      area.appendChild(div);
      area.scrollTop = area.scrollHeight;
    }

    async function sendMessage() {
      const input = document.getElementById('chat-input');
      const btn = document.getElementById('send-btn');
      const message = input.value.trim();
      if (!message || isLoading) return;

      input.value = '';
      addMessage('user', message);
      setLoading(true);

      try {
        const result = await api('POST', 'chat', { message });
        if (result.success) {
addMessage('assistant', result.data.response);
        } else {
addMessage('system', 'Error: ' + result.error);
        }
      } catch(e) {
        addMessage('system', 'Network error: ' + e.message);
      }
      setLoading(false);
    }

    function quickMsg(text) {
      document.getElementById('chat-input').value = text;
      sendMessage();
    }

    async function runSwarm() {
      const objective = document.getElementById('swarm-objective').value.trim();
      if (!objective) return;

      const resultDiv = document.getElementById('swarm-result');
      resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Running swarm...</div>';

      try {
        const result = await api('POST', 'swarm', { objective });
        if (result.success) {
resultDiv.innerHTML = `
  <div class="card">
    <div class="card-title">✅ Swarm Complete</div>
    <div class="card-desc" style="white-space: pre-wrap; margin-top: 10px;">\${result.data.summary}</div>
    <div class="card-meta">Duration: \${(result.data.duration / 1000).toFixed(1)}s | Tokens: \${result.data.tokensUsed || 'N/A'}</div>
    <pre style="margin-top: 12px; padding: 12px; background: var(--bg); border-radius: 6px; font-size: 12px; overflow-x: auto;"><code>\${escapeHtml(result.data.output || '')}</code></pre>
  </div>
`;
        } else {
resultDiv.innerHTML = '<div class="card" style="border-color: var(--error);"><div class="card-title">❌ Failed</div><div class="card-desc">' + escapeHtml(result.error) + '</div></div>';
        }
      } catch(e) {
        resultDiv.innerHTML = '<div class="card" style="border-color: var(--error);"><div class="card-title">❌ Error</div><div class="card-desc">' + escapeHtml(e.message) + '</div></div>';
      }
    }

    function setLoading(loading) {
      isLoading = loading;
      document.getElementById('send-btn').disabled = loading;
      document.getElementById('chat-input').disabled = loading;
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Initialize
    addMessage('assistant', 'Welcome to Cod3x Code v4.0 by CodexHaven! 👋\n\nI can help you with coding tasks using ' + (activeTools.size || '70+') + ' tools and 14 specialized agents.\n\nQuick commands:\n• Type naturally to chat\n• !agent <role> <task> - Run a specific agent\n• !swarm <objective> - Use swarm mode for complex tasks\n• /help - Show all commands');

    loadStatus();
    loadTools();
    loadAgents();
    loadConfig();
    setInterval(loadStatus, 30000);
