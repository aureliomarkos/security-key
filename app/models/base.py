"""
Modelo base com campos de auditoria
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import String


class TimestampMixin:
    """Mixin para adicionar campos de auditoria em todos os modelos"""
    
    created_at = Column(
        DateTime, 
        default=datetime.utcnow, 
        nullable=False,
        comment="Data de criação do registro"
    )
    
    updated_at = Column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow,
        nullable=False,
        comment="Data da última atualização"
    )
    
    deleted_at = Column(
        DateTime, 
        nullable=True,
        comment="Data de exclusão (soft delete)"
    )
    
    @property
    def is_deleted(self) -> bool:
        """Verifica se o registro foi excluído (soft delete)"""
        return self.deleted_at is not None
    
    def soft_delete(self):
        """Marca o registro como excluído"""
        self.deleted_at = datetime.utcnow()
    
    def restore(self):
        """Restaura um registro excluído"""
        self.deleted_at = None


def generate_uuid() -> str:
    """Gera um UUID como string"""
    return str(uuid.uuid4())
