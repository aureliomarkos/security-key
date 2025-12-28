"""
Router de Campos Dinâmicos - CRUD
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.models.item_cofre import ItemCofre
from app.models.campo_dinamico import CampoDinamico
from app.models.permissao import Permissao, NivelAcesso
from app.schemas.campo_dinamico import (
    CampoDinamicoCreate,
    CampoDinamicoUpdate,
    CampoDinamicoResponse
)
from app.services.auth import get_current_active_user
from app.services.crypto import CryptoService

router = APIRouter(prefix="/api/itens/{item_id}/campos", tags=["Campos Dinâmicos"])


def check_edit_access(db: Session, item_id: str, user_id: str) -> bool:
    """Verifica se o usuário pode editar o item"""
    # É o dono?
    item = db.query(ItemCofre).filter(
        ItemCofre.id == item_id,
        ItemCofre.user_id == user_id,
        ItemCofre.deleted_at.is_(None)
    ).first()
    
    if item:
        return True
    
    # Tem permissão de edição?
    permissao = db.query(Permissao).filter(
        Permissao.item_id == item_id,
        Permissao.shared_with_user_id == user_id,
        Permissao.nivel_acesso == NivelAcesso.EDITAR.value,
        Permissao.deleted_at.is_(None)
    ).first()
    
    return permissao is not None


@router.get("", response_model=List[CampoDinamicoResponse])
def listar_campos(
    item_id: str,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lista os campos de um item.
    """
    campos = db.query(CampoDinamico).filter(
        CampoDinamico.item_id == item_id,
        CampoDinamico.deleted_at.is_(None)
    ).order_by(CampoDinamico.ordem).all()
    
    # Descriptografa valores sensíveis
    for campo in campos:
        if campo.is_sensitive and campo.value:
            campo.value = CryptoService.decrypt(campo.value)
    
    return campos


@router.post("", response_model=CampoDinamicoResponse, status_code=status.HTTP_201_CREATED)
def criar_campo(
    item_id: str,
    campo: CampoDinamicoCreate,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Adiciona um novo campo a um item.
    """
    if not check_edit_access(db, item_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para editar este item"
        )
    
    value = campo.value
    if campo.is_sensitive and value:
        value = CryptoService.encrypt(value)
    
    db_campo = CampoDinamico(
        item_id=item_id,
        label=campo.label,
        value=value,
        field_type=campo.field_type.value,
        is_sensitive=campo.is_sensitive,
        ordem=campo.ordem
    )
    
    db.add(db_campo)
    db.commit()
    db.refresh(db_campo)
    
    # Descriptografa para retorno
    if db_campo.is_sensitive and db_campo.value:
        db_campo.value = CryptoService.decrypt(db_campo.value)
    
    return db_campo


@router.put("/{campo_id}", response_model=CampoDinamicoResponse)
def atualizar_campo(
    item_id: str,
    campo_id: str,
    dados: CampoDinamicoUpdate,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza um campo de um item.
    """
    if not check_edit_access(db, item_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para editar este item"
        )
    
    campo = db.query(CampoDinamico).filter(
        CampoDinamico.id == campo_id,
        CampoDinamico.item_id == item_id,
        CampoDinamico.deleted_at.is_(None)
    ).first()
    
    if not campo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campo não encontrado"
        )
    
    # Atualiza campos
    update_data = dados.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "value":
            # Verifica se precisa criptografar
            is_sensitive = dados.is_sensitive if dados.is_sensitive is not None else campo.is_sensitive
            if is_sensitive and value:
                value = CryptoService.encrypt(value)
        if field == "field_type" and value:
            value = value.value
        setattr(campo, field, value)
    
    db.commit()
    db.refresh(campo)
    
    # Descriptografa para retorno
    if campo.is_sensitive and campo.value:
        campo.value = CryptoService.decrypt(campo.value)
    
    return campo


@router.delete("/{campo_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_campo(
    item_id: str,
    campo_id: str,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Exclui um campo de um item (soft delete).
    """
    if not check_edit_access(db, item_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para editar este item"
        )
    
    campo = db.query(CampoDinamico).filter(
        CampoDinamico.id == campo_id,
        CampoDinamico.item_id == item_id,
        CampoDinamico.deleted_at.is_(None)
    ).first()
    
    if not campo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campo não encontrado"
        )
    
    campo.soft_delete()
    db.commit()
