import uuid
from sqlalchemy import Column, String, Float, Integer, Date, DateTime, UniqueConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from core.database import Base


class Facture(Base):
    __tablename__ = "factures"
    __table_args__ = (
        UniqueConstraint("user_id", "numero", name="uq_facture_user_numero"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    numero = Column(String(255), nullable=True)
    nom_fichier = Column(String(500), nullable=True)
    taille_octets = Column(Integer, nullable=True)
    date_import = Column(DateTime(timezone=True), nullable=True)

    client_nom = Column(String(255), nullable=True)
    client_email = Column(String(255), nullable=True)
    montant_ht = Column(Float, nullable=True)
    taux_tva = Column(Float, nullable=True)
    montant_ttc = Column(Float, nullable=True)
    description = Column(String, nullable=True)
    date_facture = Column(Date, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())