"""
Schemas para Item do Cofre
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.campo_dinamico import CampoDinamicoCreate, CampoDinamicoResponse
from app.schemas.categoria import CategoriaResponse


class ItemCofreBase(BaseModel):
    """Schema base para item do cofre"""
    titulo: str = Field(..., min_length=1, max_length=200, description="Título do item")
    category_id: Optional[str] = Field(None, description="ID da categoria")
    nota_adicional: Optional[str] = Field(None, description="Observações")
    favorito: bool = Field(False, description="Se é favorito")


class ItemCofreCreate(ItemCofreBase):
    """Schema para criar item do cofre"""
    campos: Optional[List[CampoDinamicoCreate]] = Field(
        default_factory=list, 
        description="Campos dinâmicos do item"
    )


class ItemCofreUpdate(BaseModel):
    """Schema para atualizar item do cofre"""
    titulo: Optional[str] = Field(None, min_length=1, max_length=200)
    category_id: Optional[str] = None
    nota_adicional: Optional[str] = None
    favorito: Optional[bool] = None
    campos: Optional[List[CampoDinamicoCreate]] = None


class ItemCofreResponse(ItemCofreBase):
    """Schema de resposta básica para item do cofre"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ItemCofreCompleto(ItemCofreResponse):
    """Schema de resposta completa com campos e categoria"""
    campos: List[CampoDinamicoResponse] = []
    categoria: Optional[CategoriaResponse] = None
    
    class Config:
        from_attributes = True
