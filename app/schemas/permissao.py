"""
Schemas para Permissão
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.permissao import NivelAcesso
from app.schemas.usuario import UsuarioResponse


class PermissaoBase(BaseModel):
    """Schema base para permissão"""
    shared_with_user_id: str = Field(..., description="ID do usuário que receberá acesso")
    nivel_acesso: NivelAcesso = Field(
        NivelAcesso.VISUALIZAR, 
        description="Nível de acesso"
    )


class PermissaoCreate(PermissaoBase):
    """Schema para criar permissão"""
    item_id: str = Field(..., description="ID do item a ser compartilhado")


class PermissaoUpdate(BaseModel):
    """Schema para atualizar permissão"""
    nivel_acesso: Optional[NivelAcesso] = None


class PermissaoResponse(PermissaoBase):
    """Schema de resposta para permissão"""
    id: str
    item_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PermissaoComUsuario(PermissaoResponse):
    """Schema de resposta com dados do usuário"""
    usuario_compartilhado: Optional[UsuarioResponse] = None
    
    class Config:
        from_attributes = True
