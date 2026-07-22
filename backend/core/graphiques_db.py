from sqlalchemy.orm import Session
from core.graphiques_models import GraphiqueEpingle


def epingler(db: Session, service: str, titre: str, graphique: dict, user_id: str) -> dict:
    g = GraphiqueEpingle(user_id=user_id, service=service, titre=titre, donnees=graphique)
    db.add(g)
    db.commit()
    db.refresh(g)
    return _vers_dict(g)


def lister(db: Session, service: str, user_id: str) -> list[dict]:
    graphiques = (
        db.query(GraphiqueEpingle)
        .filter(GraphiqueEpingle.service == service, GraphiqueEpingle.user_id == user_id)
        .order_by(GraphiqueEpingle.created_at.desc())
        .all()
    )
    return [_vers_dict(g) for g in graphiques]


def supprimer(db: Session, graphique_id: str, user_id: str) -> bool:
    g = db.query(GraphiqueEpingle).filter(GraphiqueEpingle.id == graphique_id, GraphiqueEpingle.user_id == user_id).first()
    if not g:
        return False
    db.delete(g)
    db.commit()
    return True


def _vers_dict(g: GraphiqueEpingle) -> dict:
    return {
        "id": str(g.id),
        "service": g.service,
        "titre": g.titre,
        "graphique": g.donnees,
        "created_at": g.created_at.isoformat() if g.created_at else None,
    }