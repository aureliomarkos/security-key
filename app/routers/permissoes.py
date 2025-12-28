"""
Router de Permissões - Compartilhamento de itens
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.usuario import Usuario
from app.models.item_cofre import ItemCofre
from app.models.permissao import Permissao
from app.schemas.permissao import (
    PermissaoCreate,
    PermissaoUpdate,
    PermissaoResponse,
    PermissaoComUsuario
)
from app.services.auth import get_current_active_user

router = APIRouter(prefix="/api/permissoes", tags=["Permissões"])


@router.get("/item/{item_id}", response_model=List[PermissaoComUsuario])
def listar_permissoes_item(
    item_id: str,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lista todas as permissões de um item.
    Apenas o dono pode ver.
    """
    # Verifica se é o dono
    item = db.query(ItemCofre).filter(
        ItemCofre.id == item_id,
        ItemCofre.user_id == current_user.id,
        ItemCofre.deleted_at.is_(None)
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item não encontrado"
        )
    
    permissoes = db.query(Permissao).options(
        joinedload(Permissao.usuario_compartilhado)
    ).filter(
        Permissao.item_id == item_id,
        Permissao.deleted_at.is_(None)
    ).all()
    
    return permissoes


@router.post("", response_model=PermissaoResponse, status_code=status.HTTP_201_CREATED)
def criar_permissao(
    permissao: PermissaoCreate,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Compartilha um item com outro usuário.
    Apenas o dono pode compartilhar.
    """
    # Verifica se é o dono do item
    item = db.query(ItemCofre).filter(
        ItemCofre.id == permissao.item_id,
        ItemCofre.user_id == current_user.id,
        ItemCofre.deleted_at.is_(None)
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item não encontrado"
        )
    
    # Verifica se o usuário de destino existe
    usuario_destino = db.query(Usuario).filter(
        Usuario.id == permissao.shared_with_user_id,
        Usuario.deleted_at.is_(None)
    ).first()
    
    if not usuario_destino:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Não pode compartilhar consigo mesmo
    if permissao.shared_with_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível compartilhar consigo mesmo"
        )
    
    # Verifica se já existe permissão
    existing = db.query(Permissao).filter(
        Permissao.item_id == permissao.item_id,
        Permissao.shared_with_user_id == permissao.shared_with_user_id,
        Permissao.deleted_at.is_(None)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permissão já existe para este usuário"
        )
    
    db_permissao = Permissao(
        item_id=permissao.item_id,
        shared_with_user_id=permissao.shared_with_user_id,
        nivel_acesso=permissao.nivel_acesso.value
    )
    
    db.add(db_permissao)
    db.commit()
    db.refresh(db_permissao)
    
    return db_permissao


@router.put("/{permissao_id}", response_model=PermissaoResponse)
def atualizar_permissao(
    permissao_id: str,
    dados: PermissaoUpdate,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza o nível de acesso de uma permissão.
    Apenas o dono do item pode alterar.
    """
    permissao = db.query(Permissao).filter(
        Permissao.id == permissao_id,
        Permissao.deleted_at.is_(None)
    ).first()
    
    if not permissao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permissão não encontrada"
        )
    
    # Verifica se é o dono do item
    item = db.query(ItemCofre).filter(
        ItemCofre.id == permissao.item_id,
        ItemCofre.user_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o dono pode alterar permissões"
        )
    
    if dados.nivel_acesso:
        permissao.nivel_acesso = dados.nivel_acesso.value
    
    db.commit()
    db.refresh(permissao)
    
    return permissao


@router.delete("/{permissao_id}", status_code=status.HTTP_204_NO_CONTENT)
def revogar_permissao(
    permissao_id: str,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Revoga uma permissão de acesso.
    O dono do item ou o usuário que recebeu podem revogar.
    """
    permissao = db.query(Permissao).filter(
        Permissao.id == permissao_id,
        Permissao.deleted_at.is_(None)
    ).first()
    
    if not permissao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permissão não encontrada"
        )
    
    # Verifica se é o dono do item ou quem recebeu a permissão
    item = db.query(ItemCofre).filter(ItemCofre.id == permissao.item_id).first()
    
    is_owner = item and item.user_id == current_user.id
    is_recipient = permissao.shared_with_user_id == current_user.id
    
    if not (is_owner or is_recipient):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para revogar"
        )
    
    permissao.soft_delete()
    db.commit()
