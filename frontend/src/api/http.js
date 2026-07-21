const API_BASE = "http://localhost:8020";

function getAuthHeaders(headersSupplementaires = {}) {
  const token = localStorage.getItem("access_token");
  return {
    ...headersSupplementaires,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function traiterReponse(response, messageErreurDefaut) {
  if (!response.ok) {
    let detail = messageErreurDefaut;
    try {
      const erreur = await response.json();
      detail = erreur.detail || detail;
    } catch {
      // réponse non-JSON (ex: erreur réseau brute) — on garde le message par défaut
    }
    throw new Error(detail);
  }
  return response.json();
}

/**
 * Wrapper fetch centralisé : ajoute automatiquement le token JWT,
 * gère le JSON et les FormData, uniformise la gestion d'erreurs.
 */

let refreshEnCours = null;

async function rafraichirToken() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) throw new Error("Session expirée");

  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    throw new Error("Session expirée");
  }
  const data = await response.json();
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
}

export async function apiFetch(path, { method = "GET", body, isFormData = false, messageErreur, _retry = false } = {}) {
  const headers = isFormData
    ? getAuthHeaders()
    : getAuthHeaders(body !== undefined ? { "Content-Type": "application/json" } : {});

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !_retry) {
    try {
      refreshEnCours = refreshEnCours || rafraichirToken();
      await refreshEnCours;
    } catch {
      window.location.href = "/connexion";
      throw new Error("Session expirée, veuillez vous reconnecter.");
    } finally {
      refreshEnCours = null;
    }
    return apiFetch(path, { method, body, isFormData, messageErreur, _retry: true });
  }

  return traiterReponse(response, messageErreur || "Erreur de communication avec le serveur");
}

export { API_BASE };