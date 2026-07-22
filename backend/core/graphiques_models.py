import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from core.database import Base


class GraphiqueEpingle(Base):
    __tablename__ = "graphiques_epingles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    service = Column(String(50), nullable=False)
    titre = Column(String(255), nullable=False)
    donnees = Column(JSON, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())