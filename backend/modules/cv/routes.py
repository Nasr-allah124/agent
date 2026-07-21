import os
import tempfile

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from tenacity import retry, stop_after_attempt, wait_exponential

from core.llm import get_embeddings_query
from core.retriever import RetrieverAvecBonTaskType
from core.vector_store import get_vector_store_cv
from core.security import get_current_user_id
from core.conversations import enregistrer_gestionnaire
from modules.cv.chunking import chunker_cv_llm
from modules.cv.scoring import get_rag_chain, get_scoring_chain, resumer_echange


import os
import tempfile
from datetime import datetime, timezone

EXTENSIONS_ACCEPTEES = (".pdf", ".docx")

router = APIRouter(prefix="/cv", tags=["cv"])


def get_retriever(user_id: str):
    return RetrieverAvecBonTaskType(
        vector_store=get_vector_store_cv(),
        embeddings_query=get_embeddings_query(),
        k=6,
        filtre={"user_id": user_id},
    )


class RechercheRequest(BaseModel):
    question: str





@router.post("/upload")
async def upload_cv(
    fichier: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    extension = os.path.splitext(fichier.filename)[1].lower()
    if extension not in EXTENSIONS_ACCEPTEES:
        raise HTTPException(400, "Seuls les fichiers PDF ou Word (.docx) sont acceptés.")

    contenu = await fichier.read()
    taille = len(contenu)

    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
        tmp.write(contenu)
        chemin_temp = tmp.name

    try:
        chunks = chunker_cv_llm(chemin_temp)
        date_import = datetime.now(timezone.utc).isoformat()
        for chunk in chunks:
            chunk.metadata["user_id"] = user_id
            chunk.metadata["nom_fichier"] = fichier.filename
            chunk.metadata["taille_octets"] = taille
            chunk.metadata["date_import"] = date_import
        get_vector_store_cv().add_documents(chunks)
        nom_candidat = chunks[0].metadata["candidat"]
        return {"candidat": nom_candidat, "nb_chunks": len(chunks)}
    except Exception as e:
        raise HTTPException(500, f"Erreur de traitement : {e}")
    finally:
        os.remove(chemin_temp)

@router.get("/candidats")
def liste_candidats(user_id: str = Depends(get_current_user_id)):
    vs = get_vector_store_cv()
    donnees = vs.get(where={"user_id": user_id})
    noms = sorted({m.get("candidat") for m in donnees["metadatas"] if m.get("candidat")})
    return {"candidats": noms, "total_chunks": len(donnees["ids"])}


@router.get("/documents")
def liste_documents(user_id: str = Depends(get_current_user_id)):
    vs = get_vector_store_cv()
    donnees = vs.get(where={"user_id": user_id})
    groupes = {}
    for metadata in donnees["metadatas"]:
        nom = metadata.get("nom_fichier")
        if not nom:
            continue  # anciens chunks uploadés avant cette modification, sans métadonnées fichier
        if nom not in groupes:
            groupes[nom] = {
                "nom_fichier": nom,
                "candidat": metadata.get("candidat"),
                "taille_octets": metadata.get("taille_octets"),
                "date_import": metadata.get("date_import"),
                "nb_chunks": 0,
            }
        groupes[nom]["nb_chunks"] += 1
    return list(groupes.values())


@router.post("/rechercher")
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=2, max=15))
def rechercher(payload: RechercheRequest, user_id: str = Depends(get_current_user_id)):
    vs = get_vector_store_cv()
    if len(vs.get(where={"user_id": user_id})["ids"]) == 0:
        raise HTTPException(400, "Aucun CV dans la base pour le moment.")
    scoring_chain = get_scoring_chain(get_retriever(user_id))
    resultat = scoring_chain.invoke(payload.question)
    resultat["candidats"] = sorted(resultat["candidats"], key=lambda c: c["score"], reverse=True)
    return resultat


# --- Gestionnaire branché sur le moteur de conversations (/conversations) ---

def _gestionnaire_cv(question: str, resume: str, user_id: str) -> dict:
    rag_chain = get_rag_chain(get_retriever(user_id))
    reponse = rag_chain.invoke({"question": question, "historique": resume})
    nouveau_resume = resumer_echange(resume, question, reponse)
    return {"reponse": reponse, "graphique": None, "nouveau_resume": nouveau_resume}


enregistrer_gestionnaire("cv", _gestionnaire_cv)


@router.delete("/documents/{nom_fichier}")
def supprimer_document(nom_fichier: str, user_id: str = Depends(get_current_user_id)):
    vs = get_vector_store_cv()
    donnees = vs.get(where={"$and": [{"user_id": user_id}, {"nom_fichier": nom_fichier}]})
    if not donnees["ids"]:
        raise HTTPException(404, "Document introuvable")
    vs._collection.delete(ids=donnees["ids"])
    return {"succes": True, "nb_supprimes": len(donnees["ids"])}