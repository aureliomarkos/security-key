"""
Modelo de Usuário - Quem acessa o app
"""
from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin, generate_uuid


class Usuario(Base, TimestampMixin):
    """
    Tabela de usuários do sistema.
    Armazena quem são as pessoas que acessam o app.
    """
    __tablename__ = "usuarios"
    
    id = Column(
        String(36), 
        primary_key=True, 
        default=generate_uuid,
        comment="Identificador único (UUID)"
    )
    
    nome = Column(
        String(100), 
        nullable=False,
        comment="Nome do familiar"
    )
    
    email = Column(
        String(255), 
        unique=True, 
        nullable=False, 
        index=True,
        comment="Email para login"
    )
    
    password_hash = Column(
        String(255), 
        nullable=False,
        comment="Senha de acesso ao app (criptografada com bcrypt)"
    )
    
    is_active = Column(
        Boolean, 
        default=True,
        comment="Se o usuário está ativo"
    )
    
    # Relacionamentos
    itens = relationship(
        "ItemCofre", 
        back_populates="usuario",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    permissoes_recebidas = relationship(
        "Permissao",
        foreign_keys="Permissao.shared_with_user_id",
        back_populates="usuario_compartilhado",
        lazy="dynamic"
    )
    
    def __repr__(self):
        return f"<Usuario(id={self.id}, nome={self.nome}, email={self.email})>"
