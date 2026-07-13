from fastapi import APIRouter, HTTPException, UploadFile, File
import shutil
import os
import tempfile

from modules.factures.extraction import traiter_fichier_facture
from modules.factures.db import sauvegarder_factures, lire_factures, creer_table, supprimer_facture, supprimer_par_fichier
from pydantic import BaseModel
from modules.factures.agent import poser_question
class QuestionChat(BaseModel):
    question: str

router = APIRouter(prefix="/factures", tags=["factures"])

creer_table()


from typing import List

@router.post("/upload")
async def upload_facture(fichiers: List[UploadFile] = File(...)):
    total_inserees, total_doublons = 0, 0
    toutes_factures = []
    erreurs = []

    for fichier in fichiers:
        dossier_temp = tempfile.gettempdir()
        chemin_temporaire = os.path.join(dossier_temp, fichier.filename)

        with open(chemin_temporaire, "wb") as f:
            shutil.copyfileobj(fichier.file, f)

        try:
            resultat = traiter_fichier_facture(chemin_temporaire)

            if not resultat["succes"]:
                erreurs.append({"fichier": fichier.filename, "erreur": resultat.get("erreur", "Échec inconnu")})
                continue

            # Attache le nom du fichier d'origine à chaque facture extraite de ce fichier
            for f in resultat["factures"]:
                f["nom_fichier"] = fichier.filename

            stats = sauvegarder_factures(resultat["factures"])
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
async def lister_factures():
    return lire_factures()






# @router.post("/chat")
# async def chat_facture(payload: QuestionChat):
#     resultat = poser_question(payload.question)
#     if not resultat["succes"]:
#         raise HTTPException(status_code=400, detail=resultat["erreur"])
#     return resultat
from core.conversations import enregistrer_gestionnaire
from modules.factures.agent import poser_question, resumer_echange


def _gestionnaire_facture(question: str, resume: str) -> dict:
    resultat = poser_question(question, resume)
    if not resultat["succes"]:
        return {"reponse": f"Erreur : {resultat['erreur']}", "graphique": None, "nouveau_resume": resume}
    nouveau_resume = resumer_echange(resume, question, resultat["reponse"])
    return {"reponse": resultat["reponse"], "graphique": resultat.get("graphique"), "nouveau_resume": nouveau_resume}


enregistrer_gestionnaire("facture", _gestionnaire_facture)
@router.delete("/{facture_id}")
async def supprimer_facture_route(facture_id: int):
    supprimee = supprimer_facture(facture_id)
    if not supprimee:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    return {"succes": True}
@router.delete("/par-fichier/{nom_fichier}")
async def supprimer_facture_par_fichier(nom_fichier: str):
    nb = supprimer_par_fichier(nom_fichier)
    if nb == 0:
        raise HTTPException(status_code=404, detail="Aucune facture trouvée pour ce fichier")
    return {"succes": True, "nb_supprimees": nb}