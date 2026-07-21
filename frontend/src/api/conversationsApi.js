import { apiFetch } from "./http";

export function creerConversation(service) {
  return apiFetch("/conversations", {
    method: "POST",
    body: { service },
    messageErreur: "Erreur lors de la création de la conversation",
  });
}

export function listerConversations(service) {
  return apiFetch(`/conversations?service=${service}`, {
    messageErreur: "Erreur lors du chargement des conversations",
  });
}

export function obtenirConversation(id) {
  return apiFetch(`/conversations/${id}`, {
    messageErreur: "Conversation introuvable",
  });
}

export function supprimerConversation(id) {
  return apiFetch(`/conversations/${id}`, {
    method: "DELETE",
    messageErreur: "Erreur lors de la suppression",
  });
}

export function envoyerMessage(id, question) {
  return apiFetch(`/conversations/${id}/message`, {
    method: "POST",
    body: { question },
    messageErreur: "Erreur lors de l'envoi du message",
  });
}