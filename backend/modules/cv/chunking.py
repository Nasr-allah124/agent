import re
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from core.llm import get_model

chunking_prompt_llm = ChatPromptTemplate.from_messages([
    ("system", """Tu es un extracteur de structure de CV. Découpe ce texte brut en sections logiques ET identifie le nom complet du candidat.

Retourne UNIQUEMENT un JSON valide, sans texte autour :
{{
  "nom_candidat": "nom complet détecté dans le CV",
  "sections": [
    {{"titre": "nom de la section", "contenu": "texte complet de cette section"}}
  ]
}}

Règles :
- Le nom du candidat se trouve généralement au tout début du texte (en-tête)
- Garde le texte ORIGINAL tel quel dans "contenu", ne reformule rien
- Sections typiques : EN_TETE, PROFIL, COMPETENCES, EXPERIENCE, FORMATION, PROJETS, LANGUES, SOFT_SKILLS"""),
    ("human", "Texte brut du CV :\n\n{texte_cv}")
])


def get_chunking_chain():
    return chunking_prompt_llm | get_model() | JsonOutputParser()


def nettoyer_texte(texte):
    texte = texte.replace("\t", " ")
    texte = re.sub(r' +', ' ', texte)
    return texte


def chunker_cv_llm(chemin_pdf):
    loader = PyPDFLoader(chemin_pdf)
    documents = loader.load()
    texte_complet = "\n".join([doc.page_content for doc in documents])
    texte_complet = nettoyer_texte(texte_complet)

    resultat = get_chunking_chain().invoke({"texte_cv": texte_complet})
    nom_candidat = resultat["nom_candidat"]

    return [
        Document(
            page_content=f"{s['titre']}\n{s['contenu']}",
            metadata={"section": s["titre"], "candidat": nom_candidat},
        )
        for s in resultat["sections"]
    ]