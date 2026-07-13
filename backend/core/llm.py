import os
from functools import lru_cache
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from pydantic import BaseModel

load_dotenv()

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise RuntimeError("GOOGLE_API_KEY manquante dans le fichier .env")


@lru_cache
def get_model():
    return ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite", google_api_key=GOOGLE_API_KEY)


@lru_cache
def get_embeddings_document():
    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=GOOGLE_API_KEY,
        task_type="retrieval_document",
    )


@lru_cache
def get_embeddings_query():
    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=GOOGLE_API_KEY,
        task_type="retrieval_query",
    )
def get_model_structure(schema: type[BaseModel]):
    """Retourne le modèle Gemini contraint à répondre selon le schéma Pydantic donné."""
    return get_model().with_structured_output(schema)
