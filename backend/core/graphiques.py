from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db
from core.graphiques_db import epingler, lister, supprimer
from core.security import get_current_user_id

router = APIRouter(prefix="/graphiques", tags=["graphiques"])


class EpinglerRequest(BaseModel):
    service: str
    titre: str
    graphique: dict


@router.post("")
def epingler_route(payload: EpinglerRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return epingler(db, payload.service, payload.titre, payload.graphique, user_id)


@router.get("")
def lister_route(service: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return lister(db, service, user_id)


@router.delete("/{graphique_id}")
def supprimer_route(graphique_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not supprimer(db, graphique_id, user_id):
        raise HTTPException(404, "Graphique introuvable")
    return {"succes": True}