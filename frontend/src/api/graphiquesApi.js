import { apiFetch } from "./http";

export function epinglerGraphique(service, titre, graphique) {
  return apiFetch("/graphiques", {
    method: "POST",
    body: { service, titre, graphique },
    messageErreur: "Erreur lors de l'épinglage du graphique",
  });
}

export function listerGraphiquesEpingles(service) {
  return apiFetch(`/graphiques?service=${service}`, {
    messageErreur: "Erreur lors du chargement des graphiques",
  });
}

export function supprimerGraphiqueEpingle(id) {
  return apiFetch(`/graphiques/${id}`, {
    method: "DELETE",
    messageErreur: "Erreur lors de la suppression",
  });
}