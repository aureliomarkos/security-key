"""
Schemas para Autenticação
"""
from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """Schema para token JWT"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema para dados extraídos do token"""
    user_id: Optional[str] = None
    email: Optional[str] = None
