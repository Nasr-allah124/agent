import pandas as pd
from langchain_community.document_loaders import PyPDFLoader

from core.llm import get_model_structure
from modules.factures.schemas import FactureExtraite, MappingColonnes

model_structure = get_model_structure(FactureExtraite)
model_mapping = get_model_structure(MappingColonnes)


def detecter_type(nom_fichier: str) -> str:
    """Regarde l'extension du fichier, retourne 'csv', 'excel' ou 'pdf'."""
    extension = nom_fichier.lower().split(".")[-1]
    if extension == "csv":
        return "csv"
    elif extension in ("xlsx", "xls"):
        return "excel"
    elif extension == "pdf":
        return "pdf"
    else:
        raise ValueError(f"Format non supporté : {extension}")


def lire_structure(nom_fichier: str, type_fichier: str) -> pd.DataFrame:
    """Charge un CSV ou Excel dans un DataFrame pandas."""
    if type_fichier == "csv":
        return pd.read_csv(nom_fichier)
    elif type_fichier == "excel":
        return pd.read_excel(nom_fichier)


def extraire_facture(source: str, est_pdf: bool = True) -> FactureExtraite | None:
    """Appelle le LLM sur un texte de facture PDF ou une ligne de tableau. Retourne None si échec."""
    try:
        if est_pdf:
            prompt = f"Extrait les informations de facturation de ce texte :\n\n{source}"
        else:
            prompt = f"Voici une ligne de facture brute : {source}\nExtrait et normalise les champs."
        return model_structure.invoke(prompt)
    except Exception as e:
        print(f"Erreur d'extraction : {e}")
        return None


def identifier_colonnes(colonnes: list[str]) -> MappingColonnes:
    """Appelle le LLM une seule fois pour comprendre à quoi correspond chaque colonne."""
    return model_mapping.invoke(
        f"Voici les colonnes d'un fichier de factures : {colonnes}\n"
        f"Identifie quelle colonne correspond à quel champ."
    )


def _traiter_pdf(nom_fichier: str) -> dict:
    """Une facture PDF = un texte = un appel à extraire_facture."""
    loader = PyPDFLoader(nom_fichier)
    documents = loader.load()
    texte = "\n".join(doc.page_content for doc in documents)

    resultat = extraire_facture(texte, est_pdf=True)
    if resultat is None:
        return {"succes": False, "erreur": "Extraction PDF echouee", "factures": []}

    facture = resultat.model_dump()
    facture["montant_ttc"] = round(resultat.montant_ht * (1 + resultat.taux_tva / 100), 2)
    return {"succes": True, "factures": [facture]}


def _traiter_tableau(nom_fichier: str, type_fichier: str) -> dict:
    df = lire_structure(nom_fichier, type_fichier)

    mapping = identifier_colonnes(df.columns.tolist())

    renommage = {mapping.colonne_client: "client_nom", mapping.colonne_montant_ht: "montant_ht"}
    if mapping.colonne_tva:
        renommage[mapping.colonne_tva] = "taux_tva"

    df_normalise = df.rename(columns=renommage)
    if "taux_tva" not in df_normalise.columns:
        df_normalise["taux_tva"] = 20.0

    df_normalise["montant_ttc"] = round(
        df_normalise["montant_ht"] * (1 + df_normalise["taux_tva"] / 100), 2
    )

    lignes_valides, lignes_rejetees = [], []
    for ligne in df_normalise.to_dict(orient="records"):
        if ligne["montant_ht"] <= 0 or not (0 <= ligne["taux_tva"] <= 100):
            lignes_rejetees.append(ligne)
        else:
            lignes_valides.append(ligne)

    return {"succes": True, "factures": lignes_valides, "rejetees": lignes_rejetees}


def traiter_fichier_facture(nom_fichier: str) -> dict:
    """Point d'entrée unique. Aiguille vers la bonne branche selon le type de fichier."""
    type_fichier = detecter_type(nom_fichier)

    if type_fichier == "pdf":
        return _traiter_pdf(nom_fichier)
    elif type_fichier in ("csv", "excel"):
        return _traiter_tableau(nom_fichier, type_fichier)
