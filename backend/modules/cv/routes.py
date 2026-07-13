import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel
from tenacity import retry, stop_after_attempt, wait_exponential

from core.llm import get_embeddings_query
from core.retriever import RetrieverAvecBonTaskType
from core.vector_store import get_vector_store_cv
from modules.cv.chunking import chunker_cv_llm
from modules.cv.scoring import MemoireResume, get_rag_chain, get_scoring_chain
from core.conversations import enregistrer_gestionnaire
from modules.cv.scoring import resumer_echange

router = APIRouter(prefix="/cv", tags=["cv"])

# memoire = MemoireResume()


def get_retriever():
    return RetrieverAvecBonTaskType(
        vector_store=get_vector_store_cv(),
        embeddings_query=get_embeddings_query(),
        k=6,
    )


class RechercheRequest(BaseModel):
    question: str


class ChatRequest(BaseModel):
    question: str


@router.post("/upload")
async def upload_cv(fichier: UploadFile = File(...)):
    if not fichier.filename.endswith(".pdf"):
        raise HTTPException(400, "Seuls les fichiers PDF sont acceptés.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await fichier.read())
        chemin_temp = tmp.name

    try:
        chunks = chunker_cv_llm(chemin_temp)
        get_vector_store_cv().add_documents(chunks)
        nom_candidat = chunks[0].metadata["candidat"]
        return {"candidat": nom_candidat, "nb_chunks": len(chunks)}
    except Exception as e:
        raise HTTPException(500, f"Erreur de traitement : {e}")
    finally:
        os.remove(chemin_temp)


@router.get("/candidats")
def liste_candidats():
    vs = get_vector_store_cv()
    donnees = vs.get()
    noms = sorted({m.get("candidat") for m in donnees["metadatas"] if m.get("candidat")})
    return {"candidats": noms, "total_chunks": vs._collection.count()}


@router.post("/rechercher")
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=2, max=15))
def rechercher(payload: RechercheRequest):
    if get_vector_store_cv()._collection.count() == 0:
        raise HTTPException(400, "Aucun CV dans la base pour le moment.")
    scoring_chain = get_scoring_chain(get_retriever())
    resultat = scoring_chain.invoke(payload.question)
    resultat["candidats"] = sorted(resultat["candidats"], key=lambda c: c["score"], reverse=True)
    return resultat


# @router.post("/chat")
# @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=2, max=15))
# def chat(payload: ChatRequest):
#     if get_vector_store_cv()._collection.count() == 0:
#         raise HTTPException(400, "Aucun CV dans la base pour le moment.")
#     rag_chain = get_rag_chain(get_retriever())
#     reponse = rag_chain.invoke({
#         "question": payload.question,
#         "historique": memoire.obtenir_resume(),
#     })
#     memoire.ajouter_echange(payload.question, reponse)
#     return {"reponse": reponse}


# @router.post("/chat/reset")
# def reset_chat():
#     global memoire
#     memoire = MemoireResume()
#     return {"status": "ok"}

def _gestionnaire_cv(question: str, resume: str) -> dict:
    rag_chain = get_rag_chain(get_retriever())
    reponse = rag_chain.invoke({"question": question, "historique": resume})
    nouveau_resume = resumer_echange(resume, question, reponse)
    return {"reponse": reponse, "graphique": None, "nouveau_resume": nouveau_resume}


enregistrer_gestionnaire("cv", _gestionnaire_cv)