from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Callable
from sqlalchemy.orm import Session

from core.database import get_db
from core.conversations_db import (
    creer_conversation, lister_conversations, obtenir_conversation,
    obtenir_resume, ajouter_message, mettre_a_jour_resume,
    renommer_conversation_si_premier_message, supprimer_conversation,
)
from core.security import get_current_user_id

router = APIRouter(prefix="/conversations", tags=["conversations"])

# fonction(question, resume, user_id) -> {"reponse": str, "graphique": dict|None, "nouveau_resume": str}
_gestionnaires: dict[str, Callable[[str, str, str], dict]] = {}


def enregistrer_gestionnaire(service: str, fonction: Callable[[str, str, str], dict]):
    _gestionnaires[service] = fonction


class NouvelleConversationRequest(BaseModel):
    service: str


class MessageRequest(BaseModel):
    question: str


@router.post("")
def creer(payload: NouvelleConversationRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if payload.service not in _gestionnaires:
        raise HTTPException(400, f"Service inconnu : {payload.service}")
    return creer_conversation(db, payload.service, user_id)


@router.get("")
def lister(service: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return lister_conversations(db, service, user_id)


@router.get("/{conversation_id}")
def obtenir(conversation_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    conv = obtenir_conversation(db, conversation_id, user_id)
    if conv is None:
        raise HTTPException(404, "Conversation introuvable")
    return conv


@router.delete("/{conversation_id}")
def supprimer(conversation_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not supprimer_conversation(db, conversation_id, user_id):
        raise HTTPException(404, "Conversation introuvable")
    return {"succes": True}


@router.post("/{conversation_id}/message")
def envoyer_message(
    conversation_id: str,
    payload: MessageRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    conv = obtenir_conversation(db, conversation_id, user_id)
    if conv is None:
        raise HTTPException(404, "Conversation introuvable")

    gestionnaire = _gestionnaires.get(conv["service"])
    if gestionnaire is None:
        raise HTTPException(400, f"Aucun gestionnaire pour le service {conv['service']}")

    resume_actuel = obtenir_resume(db, conversation_id, user_id)
    resultat = gestionnaire(payload.question, resume_actuel, user_id)

    ajouter_message(db, conversation_id, "user", payload.question)
    ajouter_message(db, conversation_id, "assistant", resultat["reponse"], resultat.get("graphique"))
    mettre_a_jour_resume(db, conversation_id, resultat["nouveau_resume"])
    renommer_conversation_si_premier_message(db, conversation_id, payload.question)

    return {"reponse": resultat["reponse"], "graphique": resultat.get("graphique")}