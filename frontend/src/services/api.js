const API_BASE = '/api';

async function fetchApi(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Meetings
  getMeetings: () => fetchApi('/meetings'),
  getMeeting: (id) => fetchApi(`/meetings/${id}`),
  createMeeting: (data) => fetchApi('/meetings', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  stopMeeting: (id) => fetchApi(`/meetings/${id}/stop`, { method: 'POST' }),
  deleteMeeting: (id) => fetchApi(`/meetings/${id}`, { method: 'DELETE' }),
  getSpinHistory: (id) => fetchApi(`/meetings/${id}/spin-history`),
};

export default api;
