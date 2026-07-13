from functools import lru_cache
from langchain_chroma import Chroma
from core.llm import get_embeddings_document


@lru_cache
def get_vector_store_cv():
    return Chroma(
        embedding_function=get_embeddings_document(),
        collection_name="cv_collection_api",
        persist_directory="./chroma_data_cv",
    )