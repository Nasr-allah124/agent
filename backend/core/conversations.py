from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Callable

from core.conversations_db import (
    creer_tables, creer_conversation, lister_conversations, obtenir_conversation,
    obtenir_resume, ajouter_message, mettre_a_jour_resume,
    renommer_conversation_si_premier_message, supprimer_conversation,
)

creer_tables()

router = APIRouter(prefix="/conversations", tags=["conversations"])

# Chaque module (cv, factures) enregistre ici sa fonction de traitement.
# fonction(question, resume) -> {"reponse": str, "graphique": dict|None, "nouveau_resume": str}
_gestionnaires: dict[str, Callable[[str, str], dict]] = {}


def enregistrer_gestionnaire(service: str, fonction: Callable[[str, str], dict]):
    _gestionnaires[service] = fonction


class NouvelleConversationRequest(BaseModel):
    service: str


class MessageRequest(BaseModel):
    question: str


@router.post("")
def creer(payload: NouvelleConversationRequest):
    if payload.service not in _gestionnaires:
        raise HTTPException(400, f"Service inconnu : {payload.service}")
    return creer_conversation(payload.service)


@router.get("")
def lister(service: str):
    return lister_conversations(service)


@router.get("/{conversation_id}")
def obtenir(conversation_id: int):
    conv = obtenir_conversation(conversation_id)
    if conv is None:
        raise HTTPException(404, "Conversation introuvable")
    return conv


@router.delete("/{conversation_id}")
def supprimer(conversation_id: int):
    if not supprimer_conversation(conversation_id):
        raise HTTPException(404, "Conversation introuvable")
    return {"succes": True}


@router.post("/{conversation_id}/message")
def envoyer_message(conversation_id: int, payload: MessageRequest):
    conv = obtenir_conversation(conversation_id)
    if conv is None:
        raise HTTPException(404, "Conversation introuvable")

    gestionnaire = _gestionnaires.get(conv["service"])
    if gestionnaire is None:
        raise HTTPException(400, f"Aucun gestionnaire pour le service {conv['service']}")

    resume_actuel = obtenir_resume(conversation_id)
    resultat = gestionnaire(payload.question, resume_actuel)

    ajouter_message(conversation_id, "user", payload.question)
    ajouter_message(conversation_id, "assistant", resultat["reponse"], resultat.get("graphique"))
    mettre_a_jour_resume(conversation_id, resultat["nouveau_resume"])
    renommer_conversation_si_premier_message(conversation_id, payload.question)

    return {"reponse": resultat["reponse"], "graphique": resultat.get("graphique")}