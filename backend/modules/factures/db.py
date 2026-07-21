import sqlite3
import os

CHEMIN_DB = os.path.join(os.path.dirname(__file__), "factures.db")


def creer_table():
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS factures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            numero TEXT,
            nom_fichier TEXT,
            taille_octets INTEGER,
            date_import TEXT,
            client_nom TEXT,
            client_email TEXT,
            montant_ht REAL,
            taux_tva REAL,
            montant_ttc REAL,
            description TEXT,
            date_facture TEXT,
            UNIQUE(user_id, numero)
        )
    """)
    conn.commit()
    conn.close()


def sauvegarder_factures(factures: list[dict], user_id: str) -> dict:
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    inserees, doublons = 0, 0

    for f in factures:
        try:
            cursor.execute("""
                INSERT INTO factures (user_id, numero, nom_fichier, taille_octets, date_import, client_nom, client_email, montant_ht, taux_tva, montant_ttc, description, date_facture)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                f.get("numero_facture") or f.get("numero"),
                f.get("nom_fichier"),
                f.get("taille_octets"),
                f.get("date_import"),
                f.get("client_nom"),
                f.get("client_email"),
                f.get("montant_ht"),
                f.get("taux_tva"),
                f.get("montant_ttc"),
                f.get("description"),
                f.get("date_facture"),
            ))
            inserees += 1
        except sqlite3.IntegrityError:
            doublons += 1

    conn.commit()
    conn.close()
    return {"inserees": inserees, "doublons": doublons}


def lire_factures(user_id: str) -> list[dict]:
    conn = sqlite3.connect(CHEMIN_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM factures WHERE user_id = ?", (user_id,))
    lignes = cursor.fetchall()
    conn.close()
    return [dict(ligne) for ligne in lignes]


def supprimer_facture(facture_id: int, user_id: str) -> bool:
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM factures WHERE id = ? AND user_id = ?", (facture_id, user_id))
    conn.commit()
    supprimee = cursor.rowcount > 0
    conn.close()
    return supprimee


def supprimer_par_fichier(nom_fichier: str, user_id: str) -> int:
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM factures WHERE nom_fichier = ? AND user_id = ?", (nom_fichier, user_id))
    conn.commit()
    nb_supprimees = cursor.rowcount
    conn.close()
    return nb_supprimees