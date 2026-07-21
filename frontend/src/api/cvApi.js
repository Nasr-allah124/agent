import { apiFetch } from "./http";

export function uploaderCV(fichier) {
  const formData = new FormData();
  formData.append("fichier", fichier);
  return apiFetch("/cv/upload", {
    method: "POST",
    body: formData,
    isFormData: true,
    messageErreur: "Erreur lors de l'upload du CV",
  });
}

export function listerCandidats() {
  return apiFetch("/cv/candidats", {
    messageErreur: "Erreur lors du chargement des candidats",
  });
}

export function rechercherCV(question) {
  return apiFetch("/cv/rechercher", {
    method: "POST",
    body: { question },
    messageErreur: "Erreur lors de la recherche de candidats",
  });
}
export function listerDocumentsCV() {
  return apiFetch("/cv/documents", {
    messageErreur: "Erreur lors du chargement des documents",
  });
}
export function supprimerDocumentCV(nomFichier) {
  return apiFetch(`/cv/documents/${encodeURIComponent(nomFichier)}`, {
    method: "DELETE",
    messageErreur: "Erreur lors de la suppression du CV",
  });
}