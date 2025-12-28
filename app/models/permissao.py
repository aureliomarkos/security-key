"""
Modelo de Permissão - Compartilhamento entre familiares
"""
from enum import Enum
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin, generate_uuid


class NivelAcesso(str, Enum):
    """Níveis de acesso disponíveis"""
    VISUALIZAR = "visualizar"
    EDITAR = "editar"


class Permissao(Base, TimestampMixin):
    """
    Tabela de permissões para compartilhamento de itens entre familiares.
    Define quem pode ver ou editar cada item.
    """
    __tablename__ = "permissoes"
    
    id = Column(
        String(36), 
        primary_key=True, 
        default=generate_uuid,
        comment="Identificador único (UUID)"
    )
    
    item_id = Column(
        String(36), 
        ForeignKey("itens_cofre.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="O item sendo compartilhado"
    )
    
    shared_with_user_id = Column(
        String(36), 
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="O familiar que terá acesso"
    )
    
    nivel_acesso = Column(
        String(20),
        default=NivelAcesso.VISUALIZAR.value,
        nullable=False,
        comment="Se pode apenas Visualizar ou também Editar"
    )
    
    # Relacionamentos
    item = relationship(
        "ItemCofre", 
        back_populates="permissoes"
    )
    
    usuario_compartilhado = relationship(
        "Usuario",
        foreign_keys=[shared_with_user_id],
        back_populates="permissoes_recebidas"
    )
    
    def __repr__(self):
        return f"<Permissao(item_id={self.item_id}, user_id={self.shared_with_user_id}, nivel={self.nivel_acesso})>"
