"""
Modelo de Campo Dinâmico - Campos flexíveis para cada item
"""
from enum import Enum
from sqlalchemy import Column, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin, generate_uuid


class TipoCampo(str, Enum):
    """Tipos de campo disponíveis"""
    TEXTO = "texto"
    SENHA = "senha"
    EMAIL = "email"
    TELEFONE = "telefone"
    DATA = "data"
    NUMERO = "numero"
    URL = "url"
    CPF = "cpf"
    CNPJ = "cnpj"
    ARQUIVO = "arquivo"


class CampoDinamico(Base, TimestampMixin):
    """
    Tabela para campos dinâmicos de um item.
    Permite salvar qualquer tipo de informação sem alterar a estrutura do banco.
    Ex: Agência/Conta, Data de Emissão, Usuário, Senha, CPF, etc.
    """
    __tablename__ = "campos_dinamicos"
    
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
        comment="Referência ao item na ItensCofre"
    )
    
    label = Column(
        String(100), 
        nullable=False,
        comment="Nome do campo (Ex: Usuário, Senha, CPF, Data de Validade)"
    )
    
    value = Column(
        Text, 
        nullable=True,
        comment="Valor da informação (pode ser criptografado se sensível)"
    )
    
    field_type = Column(
        String(20),
        default=TipoCampo.TEXTO.value,
        comment="Tipo do campo para renderização na UI"
    )
    
    is_sensitive = Column(
        Boolean, 
        default=False,
        comment="Se o valor deve aparecer escondido (asteriscos) na tela"
    )
    
    ordem = Column(
        String(10),
        default="0",
        comment="Ordem de exibição do campo"
    )
    
    # Relacionamentos
    item = relationship(
        "ItemCofre", 
        back_populates="campos"
    )
    
    def __repr__(self):
        return f"<CampoDinamico(id={self.id}, label={self.label}, is_sensitive={self.is_sensitive})>"
