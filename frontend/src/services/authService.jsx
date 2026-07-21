// src/services/authService.js
import api from '../lib/api';

export async function signup({ firstName, lastName, email, company, role, password }) {
  return api.post('/api/auth/signup', {
    first_name: firstName,
    last_name: lastName,
    email,
    company,
    role,
    password,
  });
}

export async function login({ email, password }) {
  const data = await api.post('/api/auth/login', { email, password });
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data;
}

export async function logout() {
  const refreshToken = localStorage.getItem('refresh_token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  if (refreshToken) {
    try {
      await api.post('/api/auth/logout', { refresh_token: refreshToken });
    } catch {
      // best-effort : la déconnexion locale a déjà eu lieu de toute façon
    }
  }
}

export function getToken() {
  return localStorage.getItem('access_token');
}

export async function forgotPassword(email) {
  return api.post('/api/auth/forgot-password', { email });
}

export async function resetPassword({ email, code, newPassword }) {
  return api.post('/api/auth/reset-password', {
    email,
    code,
    new_password: newPassword,
  });
}