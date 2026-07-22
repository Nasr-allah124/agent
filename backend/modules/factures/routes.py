from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import List
from datetime import datetime, timezone
import os
import tempfile

from sqlalchemy.orm import Session

from core.database import get_db, SessionLocal
from core.security import get_current_user_id
from modules.factures.extraction import traiter_fichier_facture
from modules.factures.db import (
    sauvegarder_factures,
    lire_factures,
    supprimer_facture,
    supprimer_par_fichier,
)
from modules.factures.agent import poser_question, resumer_echange
from core.conversations import enregistrer_gestionnaire
from pydantic import BaseModel


class QuestionChat(BaseModel):
    question: str


router = APIRouter(prefix="/factures", tags=["factures"])


@router.post("/upload")
async def upload_facture(
    fichiers: List[UploadFile] = File(...),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    total_inserees, total_doublons = 0, 0
    toutes_factures = []
    erreurs = []

    for fichier in fichiers:
        contenu = await fichier.read()
        taille = len(contenu)

        dossier_temp = tempfile.gettempdir()
        chemin_temporaire = os.path.join(dossier_temp, fichier.filename)
        with open(chemin_temporaire, "wb") as f:
            f.write(contenu)

        try:
            resultat = traiter_fichier_facture(chemin_temporaire)

            if not resultat["succes"]:
                erreurs.append({"fichier": fichier.filename, "erreur": resultat.get("erreur", "Échec inconnu")})
                continue

            for f in resultat["factures"]:
                f["nom_fichier"] = fichier.filename
                f["taille_octets"] = taille
                f["date_import"] = datetime.now(timezone.utc)

            stats = sauvegarder_factures(db, resultat["factures"], user_id)
            total_inserees += stats["inserees"]
            total_doublons += stats["doublons"]
            toutes_factures.extend(resultat["factures"])

        except ValueError as e:
            erreurs.append({"fichier": fichier.filename, "erreur": str(e)})
        finally:
            if os.path.exists(chemin_temporaire):
                os.remove(chemin_temporaire)

    return {
        "succes": True,
        "stats": {"inserees": total_inserees, "doublons": total_doublons},
        "factures": toutes_factures,
        "erreurs": erreurs,
    }


@router.get("/")
async def lister_factures(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return lire_factures(db, user_id)


@router.delete("/{facture_id}")
async def supprimer_facture_route(
    facture_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    supprimee = supprimer_facture(db, facture_id, user_id)
    if not supprimee:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    return {"succes": True}


@router.delete("/par-fichier/{nom_fichier}")
async def supprimer_facture_par_fichier(
    nom_fichier: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    nb = supprimer_par_fichier(db, nom_fichier, user_id)
    if nb == 0:
        raise HTTPException(status_code=404, detail="Aucune facture trouvée pour ce fichier")
    return {"succes": True, "nb_supprimees": nb}


# --- Gestionnaire branché sur le moteur de conversations (/conversations) ---
# Pas de "db: Session = Depends(get_db)" possible ici : cette fonction n'est pas
# appelée directement par FastAPI dans une requête HTTP, donc on ouvre/ferme
# une session manuellement, comme le fait get_db() en coulisses.

def _gestionnaire_facture(question: str, resume: str, user_id: str) -> dict:
    db = SessionLocal()
    try:
        resultat = poser_question(db, question, user_id, resume)
        if not resultat["succes"]:
            return {
                "reponse": "Désolé, une erreur inattendue est survenue. Pouvez-vous reformuler votre question ?",
                "graphique": None,
                "nouveau_resume": resume,
            }
        nouveau_resume = resumer_echange(resume, question, resultat["reponse"])
        return {"reponse": resultat["reponse"], "graphique": resultat.get("graphique"), "nouveau_resume": nouveau_resume}
    finally:
        db.close()


enregistrer_gestionnaire("facture", _gestionnaire_facture)