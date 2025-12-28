"""
Router de Usuários - CRUD (apenas para admin, opcional)
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioResponse
from app.services.auth import get_current_active_user

router = APIRouter(prefix="/api/usuarios", tags=["Usuários"])


@router.get("", response_model=List[UsuarioResponse])
def listar_usuarios(
    skip: int = Query(0, ge=0, description="Registros para pular"),
    limit: int = Query(100, ge=1, le=100, description="Limite de registros"),
    busca: str = Query(None, description="Buscar por nome ou email"),
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lista todos os usuários do sistema.
    Útil para selecionar com quem compartilhar um item.
    """
    query = db.query(Usuario).filter(Usuario.deleted_at.is_(None))
    
    if busca:
        query = query.filter(
            (Usuario.nome.ilike(f"%{busca}%")) |
            (Usuario.email.ilike(f"%{busca}%"))
        )
    
    usuarios = query.offset(skip).limit(limit).all()
    return usuarios


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obter_usuario(
    usuario_id: str,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Obtém dados de um usuário específico.
    """
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id,
        Usuario.deleted_at.is_(None)
    ).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    return usuario
