"""
Schemas para Campo Dinâmico
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.campo_dinamico import TipoCampo


class CampoDinamicoBase(BaseModel):
    """Schema base para campo dinâmico"""
    label: str = Field(..., min_length=1, max_length=100, description="Nome do campo")
    value: Optional[str] = Field(None, description="Valor do campo")
    field_type: TipoCampo = Field(TipoCampo.TEXTO, description="Tipo do campo")
    is_sensitive: bool = Field(False, description="Se é um campo sensível")
    ordem: Optional[str] = Field("0", description="Ordem de exibição")


class CampoDinamicoCreate(CampoDinamicoBase):
    """Schema para criar campo dinâmico"""
    pass


class CampoDinamicoUpdate(BaseModel):
    """Schema para atualizar campo dinâmico"""
    label: Optional[str] = Field(None, min_length=1, max_length=100)
    value: Optional[str] = None
    field_type: Optional[TipoCampo] = None
    is_sensitive: Optional[bool] = None
    ordem: Optional[str] = None


class CampoDinamicoResponse(CampoDinamicoBase):
    """Schema de resposta para campo dinâmico"""
    id: str
    item_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
