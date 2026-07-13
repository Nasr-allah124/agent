const API_BASE = "http://localhost:8020"; 

export async function creerConversation(service) {
  const response = await fetch(`${API_BASE}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service }),
  });
  if (!response.ok) throw new Error("Erreur lors de la création de la conversation");
  return response.json();
}

export async function listerConversations(service) {
  const response = await fetch(`${API_BASE}/conversations?service=${service}`);
  if (!response.ok) throw new Error("Erreur lors du chargement des conversations");
  return response.json();
}

export async function obtenirConversation(id) {
  const response = await fetch(`${API_BASE}/conversations/${id}`);
  if (!response.ok) throw new Error("Conversation introuvable");
  return response.json();
}

export async function supprimerConversation(id) {
  const response = await fetch(`${API_BASE}/conversations/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Erreur lors de la suppression");
  return response.json();
}

export async function envoyerMessage(id, question) {
  const response = await fetch(`${API_BASE}/conversations/${id}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) {
    const erreur = await response.json();
    throw new Error(erreur.detail || "Erreur lors de l'envoi du message");
  }
  return response.json();
}