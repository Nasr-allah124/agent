from sqlalchemy.orm import Session
from core.conversations_models import Conversation, Message


def creer_conversation(db: Session, service: str, user_id: str) -> dict:
    conv = Conversation(user_id=user_id, service=service)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return {"id": str(conv.id), "service": conv.service, "titre": conv.titre, "updated_at": conv.updated_at.isoformat()}


def lister_conversations(db: Session, service: str, user_id: str) -> list[dict]:
    conversations = (
        db.query(Conversation)
        .filter(Conversation.service == service, Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return [
        {"id": str(c.id), "titre": c.titre, "updated_at": c.updated_at.isoformat()}
        for c in conversations
    ]


def obtenir_conversation(db: Session, conversation_id: str, user_id: str) -> dict | None:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user_id).first()
    if conv is None:
        return None

    messages = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.asc()).all()

    return {
        "id": str(conv.id),
        "service": conv.service,
        "titre": conv.titre,
        "resume_memoire": conv.resume_memoire,
        "messages": [
            {
                "role": m.role,
                "contenu": m.contenu,
                "graphique": m.graphique,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
    }


def obtenir_resume(db: Session, conversation_id: str, user_id: str) -> str:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user_id).first()
    if conv is None or not conv.resume_memoire:
        return "Aucun échange précédent."
    return conv.resume_memoire


def ajouter_message(db: Session, conversation_id: str, role: str, contenu: str, graphique: dict | None = None):
    message = Message(conversation_id=conversation_id, role=role, contenu=contenu, graphique=graphique)
    db.add(message)
    db.commit()


def mettre_a_jour_resume(db: Session, conversation_id: str, nouveau_resume: str):
    db.query(Conversation).filter(Conversation.id == conversation_id).update({"resume_memoire": nouveau_resume})
    db.commit()


def renommer_conversation_si_premier_message(db: Session, conversation_id: str, premier_message: str):
    titre = premier_message.strip()[:48]
    if len(premier_message.strip()) > 48:
        titre += "…"
    db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.titre == "Nouvelle conversation",
    ).update({"titre": titre})
    db.commit()


def supprimer_conversation(db: Session, conversation_id: str, user_id: str) -> bool:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user_id).first()
    if not conv:
        return False
    db.delete(conv)  # cascade="all, delete-orphan" supprime aussi tous les Message associés automatiquement
    db.commit()
    return True