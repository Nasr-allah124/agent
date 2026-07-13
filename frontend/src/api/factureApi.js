const API_BASE = "http://localhost:8020";

export async function uploadFactures(fichiers) {
  const formData = new FormData();
  for (const fichier of fichiers) {
    formData.append("fichiers", fichier);
  }

  const response = await fetch(`${API_BASE}/factures/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const erreur = await response.json();
    throw new Error(erreur.detail || "Erreur lors de l'upload");
  }

  return response.json();
}

export async function listerFactures() {
  const response = await fetch(`${API_BASE}/factures/`);
  if (!response.ok) throw new Error("Erreur lors de la récupération des factures");
  return response.json();
}

export async function obtenirFacture(id) {
  const response = await fetch(`${API_BASE}/factures/${id}`);
  if (!response.ok) {
    const erreur = await response.json();
    throw new Error(erreur.detail || "Facture introuvable");
  }
  return response.json();
}

export async function modifierFacture(id, champs) {
  const response = await fetch(`${API_BASE}/factures/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(champs),
  });
  if (!response.ok) {
    const erreur = await response.json();
    throw new Error(erreur.detail || "Erreur lors de la modification");
  }
  return response.json();
}

export async function supprimerFacture(id) {
  const response = await fetch(`${API_BASE}/factures/${id}`, { method: "DELETE" });
  if (!response.ok && response.status !== 204) {
    const erreur = await response.json();
    throw new Error(erreur.detail || "Erreur lors de la suppression");
  }
  return true;
}

export async function envoyerMessageChatFacture(question) {
  const response = await fetch(`${API_BASE}/factures/chat`, {
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
export async function supprimerFacturesParFichier(nomFichier) {
  const response = await fetch(`${API_BASE}/factures/par-fichier/${encodeURIComponent(nomFichier)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const erreur = await response.json();
    throw new Error(erreur.detail || "Erreur lors de la suppression");
  }
  return response.json();
}