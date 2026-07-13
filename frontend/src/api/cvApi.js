const API_BASE = "http://localhost:8020";

export async function uploadCv(fichier) {
  const formData = new FormData();
  formData.append("fichier", fichier);

  const response = await fetch(`${API_BASE}/cv/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const erreur = await response.json();
    throw new Error(erreur.detail || "Erreur lors de l'upload");
  }

  return response.json();
}

export async function listerCandidats() {
  const response = await fetch(`${API_BASE}/cv/candidats`);
  if (!response.ok) throw new Error("Erreur lors de la récupération des candidats");
  return response.json();
}

export async function rechercherCritere(question) {
  const response = await fetch(`${API_BASE}/cv/rechercher`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) {
    const erreur = await response.json();
    throw new Error(erreur.detail || "Erreur lors de la recherche");
  }
  return response.json();
}

export async function envoyerMessageChat(question) {
  const response = await fetch(`${API_BASE}/cv/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) {
    const erreur = await response.json();
    throw new Error(erreur.detail || "Erreur lors du chat");
  }
  return response.json();
}

export async function resetChat() {
  const response = await fetch(`${API_BASE}/cv/chat/reset`, { method: "POST" });
  return response.json();
}