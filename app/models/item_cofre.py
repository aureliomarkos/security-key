"""
Modelo de Item do Cofre - Registro principal de informações
"""
from sqlalchemy import Column, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin, generate_uuid


class ItemCofre(Base, TimestampMixin):
    """
    Tabela principal onde as informações básicas do registro ficam.
    Cada item pode ter múltiplos campos dinâmicos associados.
    """
    __tablename__ = "itens_cofre"
    
    id = Column(
        String(36), 
        primary_key=True, 
        default=generate_uuid,
        comment="Identificador único (UUID)"
    )
    
    user_id = Column(
        String(36), 
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID do dono da informação"
    )
    
    category_id = Column(
        String(36), 
        ForeignKey("categorias.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="ID da categoria"
    )
    
    titulo = Column(
        String(200), 
        nullable=False,
        comment="Título do item (Ex: Banco Itaú, RG do João)"
    )
    
    nota_adicional = Column(
        Text, 
        nullable=True,
        comment="Campo de texto livre para observações"
    )
    
    favorito = Column(
        Boolean, 
        default=False,
        comment="Se o item é favorito"
    )
    
    # Relacionamentos
    usuario = relationship(
        "Usuario", 
        back_populates="itens"
    )
    
    categoria = relationship(
        "Categoria", 
        back_populates="itens"
    )
    
    campos = relationship(
        "CampoDinamico",
        back_populates="item",
        cascade="all, delete-orphan",
        lazy="joined"
    )
    
    permissoes = relationship(
        "Permissao",
        back_populates="item",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    def __repr__(self):
        return f"<ItemCofre(id={self.id}, titulo={self.titulo})>"
