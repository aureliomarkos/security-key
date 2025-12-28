"""
Schemas para Usuário
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UsuarioBase(BaseModel):
    """Schema base para usuário"""
    nome: str = Field(..., min_length=2, max_length=100, description="Nome do familiar")
    email: EmailStr = Field(..., description="Email para login")


class UsuarioCreate(UsuarioBase):
    """Schema para criar usuário"""
    password: str = Field(..., min_length=6, description="Senha de acesso")


class UsuarioUpdate(BaseModel):
    """Schema para atualizar usuário"""
    nome: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)
    is_active: Optional[bool] = None


class UsuarioResponse(UsuarioBase):
    """Schema de resposta para usuário"""
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UsuarioLogin(BaseModel):
    """Schema para login"""
    email: EmailStr
    password: str
