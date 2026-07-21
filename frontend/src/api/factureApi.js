import { apiFetch } from "./http";

export function uploadFactures(fichiers) {
  const formData = new FormData();
  for (const fichier of fichiers) formData.append("fichiers", fichier);
  return apiFetch("/factures/upload", {
    method: "POST",
    body: formData,
    isFormData: true,
    messageErreur: "Erreur lors de l'upload",
  });
}

export function listerFactures() {
  return apiFetch("/factures/", {
    messageErreur: "Erreur lors de la récupération des factures",
  });
}

export function supprimerFacture(id) {
  return apiFetch(`/factures/${id}`, {
    method: "DELETE",
    messageErreur: "Erreur lors de la suppression de la facture",
  });
}

export function supprimerFacturesParFichier(nomFichier) {
  return apiFetch(`/factures/par-fichier/${encodeURIComponent(nomFichier)}`, {
    method: "DELETE",
    messageErreur: "Erreur lors de la suppression des factures du fichier",
  });
}