from pydantic import BaseModel, Field, field_validator
from typing import Optional


class FactureExtraite(BaseModel):
    """Décrit la FORME des données qu'on extrait d'une facture (PDF ou ligne de tableau)."""
    client_nom: str = Field(description="Nom du client ou de l'entreprise cliente")
    numero_facture: Optional[str] = Field(default=None, description="Numéro de la facture si présent")
    montant_ht: float = Field(description="Montant hors taxes")
    taux_tva: float = Field(description="Taux de TVA en pourcentage, ex: 20.0")
    date_facture: Optional[str] = Field(default=None, description="Date au format AAAA-MM-JJ (ISO), ex: 2026-03-15")
    client_email: Optional[str] = Field(default=None, description="Email du client si présent")
    description: Optional[str] = Field(default=None, description="Description ou objet de la facture")

    @field_validator("montant_ht")
    @classmethod
    def montant_positif(cls, v):
        if v <= 0:
            raise ValueError("Le montant HT doit être positif")
        return v

    @field_validator("taux_tva")
    @classmethod
    def tva_plausible(cls, v):
        if not (0 <= v <= 100):
            raise ValueError("Le taux de TVA doit être entre 0 et 100")
        return v
    @field_validator("date_facture")
    @classmethod
    def normaliser_date(cls, v):
        if v is None:
            return v
        import re
        from datetime import datetime
        if re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            return v
        for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(v, fmt).strftime("%Y-%m-%d")
            except ValueError:
                continue
        return v


class MappingColonnes(BaseModel):
    """Décrit la FORME du résultat quand le LLM identifie les colonnes d'un CSV/Excel."""
    colonne_client: str = Field(description="Nom exact de la colonne contenant le nom du client")
    colonne_montant_ht: str = Field(description="Nom exact de la colonne contenant le montant HT")
    colonne_tva: Optional[str] = Field(default=None, description="Nom exact de la colonne du taux de TVA, si elle existe")


class SpecificationGraphique(BaseModel):
    """Décrit si et comment visualiser un résultat sous forme de graphique."""
    pertinent: bool = Field(description="True si un graphique aide à répondre à cette question, False si du texte suffit")
    type_graphique: Optional[str] = Field(default=None, description="'bar', 'line' ou 'pie' uniquement")
    titre: Optional[str] = Field(default=None, description="Titre court du graphique")
    cle_categorie: Optional[str] = Field(default=None, description="Nom exact de la clé (parmi celles fournies) à utiliser comme catégorie/axe X")
    cle_valeur: Optional[str] = Field(default=None, description="Nom exact de la clé (parmi celles fournies) à utiliser comme valeur numérique")