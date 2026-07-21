from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from core.graphiques_db import creer_table, epingler, lister, supprimer
from core.security import get_current_user_id

creer_table()

router = APIRouter(prefix="/graphiques", tags=["graphiques"])


class EpinglerRequest(BaseModel):
    service: str
    titre: str
    graphique: dict


@router.post("")
def epingler_route(payload: EpinglerRequest, user_id: str = Depends(get_current_user_id)):
    return epingler(payload.service, payload.titre, payload.graphique, user_id)


@router.get("")
def lister_route(service: str, user_id: str = Depends(get_current_user_id)):
    return lister(service, user_id)


@router.delete("/{graphique_id}")
def supprimer_route(graphique_id: int, user_id: str = Depends(get_current_user_id)):
    if not supprimer(graphique_id, user_id):
        raise HTTPException(404, "Graphique introuvable")
    return {"succes": True}