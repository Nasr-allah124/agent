import sqlite3
import os

CHEMIN_DB = os.path.join(os.path.dirname(__file__), "factures.db")


def creer_table():
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS factures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero TEXT UNIQUE,
            nom_fichier TEXT,
            client_nom TEXT,
            client_email TEXT,
            montant_ht REAL,
            taux_tva REAL,
            montant_ttc REAL,
            description TEXT,
            date_facture TEXT
        )
    """)
    conn.commit()
    conn.close()


def sauvegarder_factures(factures: list[dict]) -> dict:
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    inserees, doublons = 0, 0

    for f in factures:
        try:
            cursor.execute("""
                INSERT INTO factures (numero, nom_fichier, client_nom, client_email, montant_ht, taux_tva, montant_ttc, description, date_facture)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                f.get("numero_facture") or f.get("numero"),
                f.get("nom_fichier"),
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


def lire_factures() -> list[dict]:
    conn = sqlite3.connect(CHEMIN_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM factures")
    lignes = cursor.fetchall()
    conn.close()
    return [dict(ligne) for ligne in lignes]
def supprimer_facture(facture_id: int) -> bool:
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM factures WHERE id = ?", (facture_id,))
    conn.commit()
    supprimee = cursor.rowcount > 0
    conn.close()
    return supprimee
def supprimer_par_fichier(nom_fichier: str) -> int:
    conn = sqlite3.connect(CHEMIN_DB)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM factures WHERE nom_fichier = ?", (nom_fichier,))
    conn.commit()
    nb_supprimees = cursor.rowcount
    conn.close()
    return nb_supprimees