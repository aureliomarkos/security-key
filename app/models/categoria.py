"""
Modelo de Categoria - Organização dos itens
"""
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin, generate_uuid


class Categoria(Base, TimestampMixin):
    """
    Tabela de categorias para organizar os itens do cofre.
    Ex: "Banco", "Rede Social", "Documentos", "Saúde"
    """
    __tablename__ = "categorias"
    
    id = Column(
        String(36), 
        primary_key=True, 
        default=generate_uuid,
        comment="Identificador único (UUID)"
    )
    
    nome = Column(
        String(100), 
        nullable=False, 
        comment="Nome da categoria (Ex: Finanças, Documentos Pessoais)"
    )
    
    usuario_id = Column(
        String(36),
        ForeignKey("usuarios.id"),
        nullable=True,
        comment="ID do usuário dono da categoria (NULL = Global)"
    )
    
    icone = Column(
        String(50), 
        nullable=True,
        comment="Nome do ícone para facilitar a visualização"
    )
    
    descricao = Column(
        String(255),
        nullable=True,
        comment="Descrição da categoria"
    )
    
    cor = Column(
        String(7),
        nullable=True,
        default="#6366f1",
        comment="Cor da categoria em hexadecimal"
    )
    
    # Relacionamentos
    itens = relationship(
        "ItemCofre", 
        back_populates="categoria",
        lazy="dynamic"
    )
    
    def __repr__(self):
        return f"<Categoria(id={self.id}, nome={self.nome})>"
