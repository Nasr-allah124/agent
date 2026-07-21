import sqlite3
from pydantic import BaseModel, Field, field_validator

from core.llm import get_model, get_model_structure
from modules.factures.db import CHEMIN_DB
from modules.factures.schemas import SpecificationGraphique




SCHEMA_TABLE = """
Table 'factures' :
- id (INTEGER)
- numero (TEXT)
- client_nom (TEXT)
- client_email (TEXT)
- montant_ht (REAL)
- taux_tva (REAL)
- montant_ttc (REAL)
- description (TEXT)
- date_facture (TEXT, format 'AAAA-MM-JJ')
"""


class RequeteSQL(BaseModel):
    """Le LLM doit remplir ce moule — jamais de SQL libre en texte brut."""
    requete_select: str = Field(
        description="Une requête SQL SELECT uniquement, sur la table 'factures'. "
                    "Jamais de UPDATE, DELETE, INSERT ou DROP."
    )
    explication: str = Field(description="Explication courte de ce que fait la requête")

    @field_validator("requete_select")
    @classmethod
    def doit_etre_select(cls, v: str) -> str:
        v_nettoye = v.strip().rstrip(";")
        if not v_nettoye.lower().startswith("select"):
            raise ValueError("Seules les requêtes SELECT sont autorisées")
        mots_interdits = ["drop", "delete", "update", "insert", "alter", "attach", "pragma"]
        if any(mot in v_nettoye.lower() for mot in mots_interdits):
            raise ValueError("Requête contient une opération non autorisée")
        return v_nettoye


model_sql = get_model_structure(RequeteSQL)


def generer_requete(question: str, historique: str = "") -> RequeteSQL | None:
    try:
        prompt = (
            f"Voici le schéma de la base de données :\n{SCHEMA_TABLE}\n\n"
            f"Résumé de la conversation précédente : {historique}\n\n"
            f"Question de l'utilisateur : {question}\n\n"
            f"Génère UNE SEULE requête SQL SELECT pour répondre à cette question, "
            f"en tenant compte du résumé si la question fait référence à un échange précédent "
            f"(ex: 'et pour janvier ?', 'et lui ?'). "
            f"Pour des comparaisons ou des totaux par client, utilise GROUP BY si nécessaire."
        )
        return model_sql.invoke(prompt)
    except Exception as e:
        print(f"Erreur de génération SQL : {e}")
        return None


def executer_requete(requete_sql: str, user_id: str) -> list[dict]:
    """Exécute une requête déjà validée comme SELECT-only, strictement isolée par utilisateur."""
    requete_isolee = f"WITH factures AS (SELECT * FROM main.factures WHERE user_id = ?) {requete_sql}"
    conn = sqlite3.connect(CHEMIN_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(requete_isolee, (user_id,))
    lignes = cursor.fetchall()
    conn.close()
    return [dict(ligne) for ligne in lignes]


def reformuler_reponse(question: str, resultats: list[dict]) -> str:
    """Transforme le résultat brut SQL en réponse naturelle."""
    model = get_model()
    prompt = (
        f"Question posée : {question}\n"
        f"Résultats de la base de données : {resultats}\n\n"
        f"Réponds à la question de façon claire et concise, en te basant uniquement sur ces résultats. "
        f"Si les résultats sont vides, dis-le clairement."
    )
    reponse = model.invoke(prompt)

    # Gère les deux formats possibles : string directe ou liste de blocs
    if isinstance(reponse.content, str):
        return reponse.content
    elif isinstance(reponse.content, list):
        textes = [bloc.get("text", "") for bloc in reponse.content if isinstance(bloc, dict) and bloc.get("type") == "text"]
        return " ".join(textes)
    return str(reponse.content)


def poser_question(question: str, user_id: str, historique: str = "") -> dict:
    requete = generer_requete(question, historique)
    if requete is None:
        return {
            "succes": True,
            "reponse": (
                "Je n'ai pas réussi à comprendre votre question sous cette forme. "
                "Pouvez-vous préciser, par exemple un nom de client, une période, ou un montant ?"
            ),
            "requete_utilisee": None,
            "resultats_bruts": [],
            "graphique": None,
        }

    try:
        resultats = executer_requete(requete.requete_select, user_id)
    except sqlite3.Error:
        return {
            "succes": True,
            "reponse": (
                "Je n'ai pas cette information disponible dans les données actuelles de vos factures "
                "(par exemple, le statut de paiement n'est pas encore suivi dans le système). "
                "Voulez-vous que je vous montre plutôt le total, ou la liste par client ?"
            ),
            "requete_utilisee": requete.requete_select,
            "resultats_bruts": [],
            "graphique": None,
        }

    reponse = reformuler_reponse(question, resultats)

    graphique = None
    spec = generer_specification_graphique(question, resultats)
    if spec and spec.pertinent:
        graphique = {
            "type": spec.type_graphique,
            "titre": spec.titre,
            "donnees": [
                {"categorie": r.get(spec.cle_categorie), "valeur": r.get(spec.cle_valeur)}
                for r in resultats
            ],
        }

    return {
        "succes": True,
        "reponse": reponse,
        "requete_utilisee": requete.requete_select,
        "resultats_bruts": resultats,
        "graphique": graphique,
    }
model_graphique = get_model_structure(SpecificationGraphique)
def generer_specification_graphique(question: str, resultats: list[dict]) -> SpecificationGraphique | None:
    if not resultats:
        return None
    try:
        cles_disponibles = list(resultats[0].keys())
        echantillon = resultats[:5]
        prompt = (
            f"Question posée : {question}\n"
            f"Clés disponibles dans les résultats : {cles_disponibles}\n"
            f"Échantillon des résultats : {echantillon}\n\n"
            f"Détermine si un graphique aiderait à répondre à cette question "
            f"(utile pour comparer plusieurs valeurs, une répartition, une évolution ; "
            f"pas utile pour un total unique ou une réponse oui/non). "
            f"Si oui, choisis cle_categorie et cle_valeur PARMI les clés disponibles listées ci-dessus, "
            f"jamais un nom inventé."
        )
        return model_graphique.invoke(prompt)
    except Exception as e:
        print(f"Erreur génération graphique : {e}")
        return None
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from tenacity import retry, stop_after_attempt, wait_exponential

resume_prompt_factures = ChatPromptTemplate.from_messages([
    ("system", "Tu résumes une conversation entre un utilisateur et un assistant qui analyse "
               "des factures. Produis un résumé concis (maximum 100 mots) : clients mentionnés, "
               "périodes, critères de recherche, conclusions déjà données."),
    ("human", "Résumé actuel :\n{resume}\n\nNouvel échange :\nQuestion : {question}\nRéponse : {reponse}\n\nNouveau résumé :")
])


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=2, min=2, max=30))
def resumer_echange(resume_actuel: str, question: str, reponse: str) -> str:
    chain = resume_prompt_factures | get_model() | StrOutputParser()
    return chain.invoke({"resume": resume_actuel, "question": question, "reponse": reponse})