from operator import itemgetter

from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from tenacity import retry, stop_after_attempt, wait_exponential

from core.llm import get_model
from core.retriever import format_docs

scoring_prompt = ChatPromptTemplate.from_messages([
    ("system", """Tu es un assistant RH expert en analyse de CV. Tu reçois des extraits de CV de plusieurs candidats et un critère de recherche (une compétence technique OU une question factuelle).

Pour CHAQUE candidat présent dans le contexte, évalue sa correspondance au critère demandé.

Retourne UNIQUEMENT un JSON valide, sans texte autour, sous cette forme exacte :
{{
  "critere_recherche": "...",
  "candidats": [
    {{
      "nom": "nom du candidat",
      "score": 0-100,
      "correspond_au_critere": true/false,
      "justification": "phrase courte expliquant le score, basée uniquement sur le contexte fourni"
    }}
  ]
}}

Règles :
- Compétence technique : 0 = absent, 60-80 = mentionnée simplement, 80-100 = utilisée dans un projet
- Question factuelle oui/non : 100 si confirmé, 0 si absent, 50 si ambigu
- Ne mentionne QUE les candidats présents dans le contexte fourni
- Utilise TOUJOURS le nom exact indiqué entre crochets [Candidat: ...], jamais un nom inventé
- Base-toi uniquement sur le contexte, n'invente rien"""),
    ("human", "Contexte (chunks de plusieurs CV) :\n{context}\n\nCritère recherché : {question}")
])

resume_prompt = ChatPromptTemplate.from_messages([
    ("system", "Tu résumes une conversation entre un recruteur et un assistant qui analyse "
               "des CV. Produis un résumé concis (maximum 100 mots) qui garde uniquement les "
               "informations utiles pour comprendre la suite : noms de candidats déjà "
               "mentionnés, critères de recherche, conclusions déjà données."),
    ("human", "Résumé actuel de la conversation :\n{resume}\n\n"
              "Nouvel échange à intégrer :\n"
              "Question : {question}\nRéponse : {reponse}\n\n"
              "Nouveau résumé mis à jour :")
])

rag_prompt = ChatPromptTemplate.from_messages([
    ("system", "Tu es un assistant RH expert en analyse de CV. Réponds en te basant "
               "uniquement sur le contexte fourni. Précise de quel(s) candidat(s) tu parles. "
               "Si l'information n'est pas dans le contexte, dis-le clairement. Utilise le "
               "résumé de la conversation précédente pour comprendre les questions de suivi "
               "(ex: 'et lui ?', 'et pour le deuxième ?')."),
    ("human", "Résumé de la conversation précédente :\n{historique}\n\n"
              "Contexte des CV :\n{context}\n\nQuestion : {question}")
])


def get_scoring_chain(retriever):
    return (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | scoring_prompt
        | get_model()
        | JsonOutputParser()
    )


def get_rag_chain(retriever):
    return (
        {
            "context": itemgetter("question") | retriever | format_docs,
            "question": itemgetter("question"),
            "historique": itemgetter("historique"),
        }
        | rag_prompt
        | get_model()
        | StrOutputParser()
    )


class MemoireResume:
    def __init__(self):
        self.resume = ""
        self.chain_resume = resume_prompt | get_model() | StrOutputParser()

    def obtenir_resume(self):
        return self.resume if self.resume else "Aucun échange précédent."

    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=2, min=2, max=30))
    def ajouter_echange(self, question, reponse):
        self.resume = self.chain_resume.invoke({
            "resume": self.obtenir_resume(),
            "question": question,
            "reponse": reponse,
        })



@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=2, min=2, max=30))
def resumer_echange(resume_actuel: str, question: str, reponse: str) -> str:
     chain_resume = resume_prompt | get_model() | StrOutputParser()
     return chain_resume.invoke({
        "resume": resume_actuel if resume_actuel else "Aucun échange précédent.",
        "question": question,
        "reponse": reponse,
       })
