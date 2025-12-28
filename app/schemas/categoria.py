"""
Schemas para Categoria
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CategoriaBase(BaseModel):
    """Schema base para categoria"""
    nome: str = Field(..., min_length=2, max_length=100, description="Nome da categoria")
    icone: Optional[str] = Field(None, max_length=50, description="Nome do ícone")
    descricao: Optional[str] = Field(None, max_length=255, description="Descrição")
    cor: Optional[str] = Field("#6366f1", max_length=7, description="Cor em hexadecimal")


class CategoriaCreate(CategoriaBase):
    """Schema para criar categoria"""
    pass


class CategoriaUpdate(BaseModel):
    """Schema para atualizar categoria"""
    nome: Optional[str] = Field(None, min_length=2, max_length=100)
    icone: Optional[str] = Field(None, max_length=50)
    descricao: Optional[str] = Field(None, max_length=255)
    cor: Optional[str] = Field(None, max_length=7)


class CategoriaResponse(CategoriaBase):
    """Schema de resposta para categoria"""
    id: str
    usuario_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
