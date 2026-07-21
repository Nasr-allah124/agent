// src/lib/api.js
// En dev, crée un fichier .env à la racine du frontend avec :
// VITE_API_URL=http://localhost:8020

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8020';

let refreshEnCours = null;

async function rafraichirToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('Session expirée');

  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    throw new Error('Session expirée');
  }
  const data = await res.json();
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data.access_token;
}

async function request(path, { method = 'GET', body, auth = false, _retry = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = localStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && !_retry) {
    try {
      refreshEnCours = refreshEnCours || rafraichirToken();
      await refreshEnCours;
    } catch {
      window.location.href = '/connexion';
      throw new Error('Session expirée, veuillez vous reconnecter.');
    } finally {
      refreshEnCours = null;
    }
    return request(path, { method, body, auth, _retry: true });
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.detail || `Erreur ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
};

export default api;