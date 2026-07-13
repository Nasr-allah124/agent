import sqlite3
import os
import json
from datetime import datetime, timezone

CHEMIN_DB = os.path.join(os.path.dirname(__file__), "conversations.db")


def creer_tables():
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service TEXT NOT NULL,
            titre TEXT NOT NULL DEFAULT 'Nouvelle conversation',
            resume_memoire TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            contenu TEXT NOT NULL,
            graphique TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations (id)
        )
    """)
    conn.commit()
    conn.close()


def _maintenant():
    return datetime.now(timezone.utc).isoformat()


def creer_conversation(service: str) -> dict:
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    maintenant = _maintenant()
    cursor.execute(
        "INSERT INTO conversations (service, titre, resume_memoire, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (service, "Nouvelle conversation", "", maintenant, maintenant),
    )
    conversation_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": conversation_id, "service": service, "titre": "Nouvelle conversation", "updated_at": maintenant}


def lister_conversations(service: str) -> list[dict]:
    conn = sqlite3.connect(CHEMIN_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, titre, updated_at FROM conversations WHERE service = ? ORDER BY updated_at DESC",
        (service,),
    )
    lignes = cursor.fetchall()
    conn.close()
    return [dict(l) for l in lignes]


def obtenir_conversation(conversation_id: int) -> dict | None:
    conn = sqlite3.connect(CHEMIN_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM conversations WHERE id = ?", (conversation_id,))
    conv = cursor.fetchone()
    if conv is None:
        conn.close()
        return None
    cursor.execute(
        "SELECT role, contenu, graphique, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC",
        (conversation_id,),
    )
    messages = []
    for m in cursor.fetchall():
        d = dict(m)
        d["graphique"] = json.loads(d["graphique"]) if d["graphique"] else None
        messages.append(d)
    conn.close()
    conv_dict = dict(conv)
    conv_dict["messages"] = messages
    return conv_dict


def obtenir_resume(conversation_id: int) -> str:
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    cursor.execute("SELECT resume_memoire FROM conversations WHERE id = ?", (conversation_id,))
    ligne = cursor.fetchone()
    conn.close()
    return ligne[0] if ligne and ligne[0] else "Aucun échange précédent."


def ajouter_message(conversation_id: int, role: str, contenu: str, graphique: dict | None = None):
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO messages (conversation_id, role, contenu, graphique, created_at) VALUES (?, ?, ?, ?, ?)",
        (conversation_id, role, contenu, json.dumps(graphique) if graphique else None, _maintenant()),
    )
    conn.commit()
    conn.close()


def mettre_a_jour_resume(conversation_id: int, nouveau_resume: str):
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE conversations SET resume_memoire = ?, updated_at = ? WHERE id = ?",
        (nouveau_resume, _maintenant(), conversation_id),
    )
    conn.commit()
    conn.close()


def renommer_conversation_si_premier_message(conversation_id: int, premier_message: str):
    titre = premier_message.strip()[:48]
    if len(premier_message.strip()) > 48:
        titre += "…"
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE conversations SET titre = ? WHERE id = ? AND titre = 'Nouvelle conversation'",
        (titre, conversation_id),
    )
    conn.commit()
    conn.close()


def supprimer_conversation(conversation_id: int) -> bool:
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
    cursor.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
    conn.commit()
    supprimee = cursor.rowcount > 0
    conn.close()
    return supprimee