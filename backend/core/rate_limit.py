import time
from collections import defaultdict
from threading import Lock

_tentatives: dict[str, list[float]] = defaultdict(list)
_verrou = Lock()


def verifier_limite(cle: str, max_tentatives: int, fenetre_secondes: int) -> bool:
    """True si la tentative est autorisée, False si la limite est dépassée.
    Implémentation en mémoire : suffisante pour un seul processus.
    Pour un déploiement multi-workers, remplacer par Redis (ex: slowapi + redis)."""
    maintenant = time.time()
    with _verrou:
        historique = _tentatives[cle]
        historique[:] = [t for t in historique if maintenant - t < fenetre_secondes]
        if len(historique) >= max_tentatives:
            return False
        historique.append(maintenant)
        return True