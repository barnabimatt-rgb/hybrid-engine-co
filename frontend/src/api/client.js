// frontend/src/api/client.js — API fetch wrapper
const BASE = '/api';

export async function fetchJSON(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  overview: () => fetchJSON('/dashboard/overview'),
  revenue: (days = 30) => fetchJSON(`/dashboard/revenue?days=${days}`),
  output: () => fetchJSON('/dashboard/output'),
  limits: () => fetchJSON('/dashboard/limits'),
  health: () => fetchJSON('/dashboard/health'),
  pipelines: (limit = 20) => fetchJSON(`/dashboard/pipelines?limit=${limit}`),
  events: (limit = 50) => fetchJSON(`/dashboard/events?limit=${limit}`),
  triggerPipeline: (name, body = {}) => fetch(`/api/triggers/run/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()),
  availablePipelines: () => fetchJSON('/triggers/available'),
};

export default api;
