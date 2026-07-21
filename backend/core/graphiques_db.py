import sqlite3
import os
import json
from datetime import datetime, timezone

CHEMIN_DB = os.path.join(os.path.dirname(__file__), "graphiques.db")


def creer_table():
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS graphiques_epingles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            service TEXT NOT NULL,
            titre TEXT NOT NULL,
            donnees_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def epingler(service: str, titre: str, graphique: dict, user_id: str) -> dict:
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    maintenant = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        "INSERT INTO graphiques_epingles (user_id, service, titre, donnees_json, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, service, titre, json.dumps(graphique), maintenant),
    )
    id_cree = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": id_cree, "service": service, "titre": titre, "graphique": graphique, "created_at": maintenant}


def lister(service: str, user_id: str) -> list[dict]:
    conn = sqlite3.connect(CHEMIN_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, service, titre, donnees_json, created_at FROM graphiques_epingles WHERE service = ? AND user_id = ? ORDER BY created_at DESC",
        (service, user_id),
    )
    lignes = cursor.fetchall()
    conn.close()
    resultat = []
    for l in lignes:
        d = dict(l)
        d["graphique"] = json.loads(d.pop("donnees_json"))
        resultat.append(d)
    return resultat


def supprimer(graphique_id: int, user_id: str) -> bool:
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM graphiques_epingles WHERE id = ? AND user_id = ?", (graphique_id, user_id))
    conn.commit()
    supprime = cursor.rowcount > 0
    conn.close()
    return supprime