from typing import List
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever


class RetrieverAvecBonTaskType(BaseRetriever):
    vector_store: any
    embeddings_query: any
    k: int = 6
    filtre: dict | None = None

    def _get_relevant_documents(self, query: str) -> List[Document]:
        query_vector = self.embeddings_query.embed_query(query)
        return self.vector_store.similarity_search_by_vector(query_vector, k=self.k, filter=self.filtre)


def format_docs(docs) -> str:
    return "\n\n".join(
        f"[Candidat: {doc.metadata.get('candidat', '?')} | Section: {doc.metadata.get('section', '?')}]\n{doc.page_content}"
        for doc in docs
    )