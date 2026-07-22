from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from modules.factures.models import Facture


def sauvegarder_factures(db: Session, factures: list[dict], user_id: str) -> dict:
    inserees, doublons = 0, 0

    for f in factures:
        facture = Facture(
            user_id=user_id,
            numero=f.get("numero_facture") or f.get("numero"),
            nom_fichier=f.get("nom_fichier"),
            taille_octets=f.get("taille_octets"),
            date_import=f.get("date_import"),
            client_nom=f.get("client_nom"),
            client_email=f.get("client_email"),
            montant_ht=f.get("montant_ht"),
            taux_tva=f.get("taux_tva"),
            montant_ttc=f.get("montant_ttc"),
            description=f.get("description"),
            date_facture=f.get("date_facture"),
        )
        db.add(facture)
        try:
            db.commit()
            inserees += 1
        except IntegrityError:
            db.rollback()
            doublons += 1

    return {"inserees": inserees, "doublons": doublons}


def lire_factures(db: Session, user_id: str) -> list[dict]:
    factures = db.query(Facture).filter(Facture.user_id == user_id).all()
    return [_vers_dict(f) for f in factures]


def supprimer_facture(db: Session, facture_id: str, user_id: str) -> bool:
    facture = db.query(Facture).filter(Facture.id == facture_id, Facture.user_id == user_id).first()
    if not facture:
        return False
    db.delete(facture)
    db.commit()
    return True


def supprimer_par_fichier(db: Session, nom_fichier: str, user_id: str) -> int:
    nb = db.query(Facture).filter(Facture.nom_fichier == nom_fichier, Facture.user_id == user_id).delete()
    db.commit()
    return nb


def _vers_dict(facture: Facture) -> dict:
    return {
        "id": str(facture.id),
        "numero": facture.numero,
        "nom_fichier": facture.nom_fichier,
        "taille_octets": facture.taille_octets,
        "date_import": facture.date_import.isoformat() if facture.date_import else None,
        "client_nom": facture.client_nom,
        "client_email": facture.client_email,
        "montant_ht": facture.montant_ht,
        "taux_tva": facture.taux_tva,
        "montant_ttc": facture.montant_ttc,
        "description": facture.description,
        "date_facture": facture.date_facture.isoformat() if facture.date_facture else None,
    }