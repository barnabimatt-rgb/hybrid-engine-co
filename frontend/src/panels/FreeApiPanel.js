// frontend/src/panels/FreeApiPanel.js — Dashboard panel for free API agents
// This is injected into the main index.html dashboard

export const FREE_API_PANEL_CONFIG = {
  navLabel: 'Free APIs',
  pageKey: 'freeApis',
  apiEndpoint: '/api/free-apis',
  healthEndpoint: '/api/free-apis/health',
  refreshIntervalMs: 60000,
};

/**
 * Render function for the Free APIs dashboard panel
 * Called from index.html when the "Free APIs" tab is active
 * @param {object} data - { agents, health }
 * @returns {string} HTML string
 */
export function renderFreeApisPanel(data) {
  if (!data || !data.agents) return '<div class="loading">Loading Free API agents...</div>';

  const agents = data.agents || [];
  const health = data.health || {};
  const healthyCount = agents.filter((a) => a.healthy).length;

  const categoryColors = {
    weather: '#00D4FF',
    environment: '#00E676',
    fitness: '#FF9100',
    nutrition: '#FFD600',
    finance: '#9C27B0',
    science: '#2196F3',
    productivity: '#4CAF50',
    geocoding: '#FF5722',
    content: '#E91E63',
    education: '#00BCD4',
  };

  const agentCards = agents.map((a) => {
    const color = categoryColors[a.category] || '#888';
    const statusColor = a.healthy ? 'var(--green)' : 'var(--red)';
    const statusText = a.healthy ? 'Healthy' : 'Unhealthy';

    return `
      <div class="card" style="border-left: 3px solid ${color}">
        <h3 style="display:flex;justify-content:space-between;align-items:center">
          <span>${a.name.replace('Agent', '')}</span>
          <span class="badge ${a.healthy ? 'green' : 'red'}">${statusText}</span>
        </h3>
        <div class="sub" style="margin-top:4px">
          <span style="color:${color}">${a.category}</span> · 
          ${a.authMethod === 'none' ? 'No auth' : 'API key'} · 
          ${a.rateLimit}/min
        </div>
        <div style="margin-top:8px;font-family:var(--mono);font-size:11px;color:var(--text-dim);word-break:break-all">${a.baseUrl}</div>
        <div style="margin-top:8px;display:flex;justify-content:space-between">
          <span class="sub">Requests: ${a.requestCount || 0}</span>
          <button onclick="testAgent('${a.name}')" style="background:var(--surface2);border:1px solid var(--border);color:var(--accent);padding:4px 12px;border-radius:4px;cursor:pointer;font-size:11px">Test</button>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="section-title">Free API Agents</div>
    <div class="grid grid-4">
      <div class="card"><h3>Total Agents</h3><div class="value">${agents.length}</div></div>
      <div class="card"><h3>Healthy</h3><div class="value" style="color:var(--green)">${healthyCount}</div></div>
      <div class="card"><h3>Unhealthy</h3><div class="value" style="color:${agents.length - healthyCount > 0 ? 'var(--red)' : 'var(--green)'}">${agents.length - healthyCount}</div></div>
      <div class="card"><h3>Auth Required</h3><div class="value">${agents.filter((a) => a.authMethod !== 'none').length}</div><div class="sub">of ${agents.length}</div></div>
    </div>

    <div class="section-title">Agent Status</div>
    <div class="grid grid-3">
      ${agentCards}
    </div>

    <div class="section-title">API Coverage by Category</div>
    <div class="grid grid-4">
      ${Object.entries(
        agents.reduce((acc, a) => { acc[a.category] = (acc[a.category] || 0) + 1; return acc; }, {})
      ).map(([cat, count]) => `
        <div class="card">
          <h3 style="color:${categoryColors[cat] || '#888'}">${cat}</h3>
          <div class="value">${count}</div>
          <div class="sub">agent${count > 1 ? 's' : ''}</div>
        </div>
      `).join('')}
    </div>

    <div id="testResult" style="margin-top:16px"></div>
  `;
}
