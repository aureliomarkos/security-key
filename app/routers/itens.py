"""
Router de Itens do Cofre - CRUD Principal
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.usuario import Usuario
from app.models.item_cofre import ItemCofre
from app.models.campo_dinamico import CampoDinamico
from app.models.permissao import Permissao, NivelAcesso
from app.schemas.item_cofre import (
    ItemCofreCreate, 
    ItemCofreUpdate, 
    ItemCofreResponse,
    ItemCofreCompleto
)
from app.schemas.campo_dinamico import CampoDinamicoCreate
from app.services.auth import get_current_active_user
from app.services.crypto import CryptoService

router = APIRouter(prefix="/api/itens", tags=["Itens do Cofre"])


def check_item_access(
    db: Session, 
    item_id: str, 
    user_id: str, 
    require_edit: bool = False
) -> Optional[ItemCofre]:
    """
    Verifica se o usuário tem acesso ao item.
    Retorna o item se tiver acesso, None caso contrário.
    """
    # Primeiro, verifica se é o dono
    item = db.query(ItemCofre).filter(
        ItemCofre.id == item_id,
        ItemCofre.user_id == user_id,
        ItemCofre.deleted_at.is_(None)
    ).first()
    
    if item:
        return item
    
    # Se não é dono, verifica permissões
    item = db.query(ItemCofre).filter(
        ItemCofre.id == item_id,
        ItemCofre.deleted_at.is_(None)
    ).first()
    
    if not item:
        return None
    
    # Verifica permissão
    permissao = db.query(Permissao).filter(
        Permissao.item_id == item_id,
        Permissao.shared_with_user_id == user_id,
        Permissao.deleted_at.is_(None)
    ).first()
    
    if not permissao:
        return None
    
    if require_edit and permissao.nivel_acesso != NivelAcesso.EDITAR.value:
        return None
    
    return item


@router.get("", response_model=List[ItemCofreCompleto])
def listar_itens(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    categoria_id: str = Query(None, description="Filtrar por categoria"),
    favoritos: bool = Query(None, description="Apenas favoritos"),
    busca: str = Query(None, description="Buscar por título"),
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lista os itens do cofre do usuário logado.
    Inclui itens próprios e compartilhados.
    """
    # Itens próprios
    query = db.query(ItemCofre).options(
        joinedload(ItemCofre.campos),
        joinedload(ItemCofre.categoria)
    ).filter(
        ItemCofre.user_id == current_user.id,
        ItemCofre.deleted_at.is_(None)
    )
    
    # Filtros
    if categoria_id:
        query = query.filter(ItemCofre.category_id == categoria_id)
    
    if favoritos is not None:
        query = query.filter(ItemCofre.favorito == favoritos)
    
    if busca:
        query = query.filter(ItemCofre.titulo.ilike(f"%{busca}%"))
    
    itens = query.order_by(ItemCofre.favorito.desc(), ItemCofre.titulo).offset(skip).limit(limit).all()
    
    # Descriptografa valores sensíveis
    for item in itens:
        for campo in item.campos:
            if campo.is_sensitive and campo.value:
                campo.value = CryptoService.decrypt(campo.value)
    
    return itens


@router.get("/compartilhados", response_model=List[ItemCofreCompleto])
def listar_itens_compartilhados(
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lista os itens compartilhados com o usuário logado.
    """
    # Busca permissões do usuário
    permissoes = db.query(Permissao).filter(
        Permissao.shared_with_user_id == current_user.id,
        Permissao.deleted_at.is_(None)
    ).all()
    
    item_ids = [p.item_id for p in permissoes]
    
    if not item_ids:
        return []
    
    itens = db.query(ItemCofre).options(
        joinedload(ItemCofre.campos),
        joinedload(ItemCofre.categoria)
    ).filter(
        ItemCofre.id.in_(item_ids),
        ItemCofre.deleted_at.is_(None)
    ).all()
    
    # Descriptografa valores sensíveis
    for item in itens:
        for campo in item.campos:
            if campo.is_sensitive and campo.value:
                campo.value = CryptoService.decrypt(campo.value)
    
    return itens


@router.post("", response_model=ItemCofreCompleto, status_code=status.HTTP_201_CREATED)
def criar_item(
    item: ItemCofreCreate,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Cria um novo item no cofre.
    """
    # Cria o item
    db_item = ItemCofre(
        user_id=current_user.id,
        titulo=item.titulo,
        category_id=item.category_id,
        nota_adicional=item.nota_adicional,
        favorito=item.favorito
    )
    
    db.add(db_item)
    db.flush()  # Para obter o ID
    
    # Adiciona campos dinâmicos
    for campo in item.campos:
        value = campo.value
        # Criptografa se for sensível
        if campo.is_sensitive and value:
            value = CryptoService.encrypt(value)
        
        db_campo = CampoDinamico(
            item_id=db_item.id,
            label=campo.label,
            value=value,
            field_type=campo.field_type.value,
            is_sensitive=campo.is_sensitive,
            ordem=campo.ordem
        )
        db.add(db_campo)
    
    db.commit()
    db.refresh(db_item)
    
    # Descriptografa para retorno
    for campo in db_item.campos:
        if campo.is_sensitive and campo.value:
            campo.value = CryptoService.decrypt(campo.value)
    
    return db_item


@router.get("/{item_id}", response_model=ItemCofreCompleto)
def obter_item(
    item_id: str,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Obtém um item específico do cofre.
    """
    item = db.query(ItemCofre).options(
        joinedload(ItemCofre.campos),
        joinedload(ItemCofre.categoria)
    ).filter(
        ItemCofre.id == item_id,
        ItemCofre.deleted_at.is_(None)
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item não encontrado"
        )
    
    # Verifica acesso
    if not check_item_access(db, item_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    
    # Descriptografa valores sensíveis
    for campo in item.campos:
        if campo.is_sensitive and campo.value:
            campo.value = CryptoService.decrypt(campo.value)
    
    return item


@router.put("/{item_id}", response_model=ItemCofreCompleto)
def atualizar_item(
    item_id: str,
    dados: ItemCofreUpdate,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza um item do cofre.
    """
    item = check_item_access(db, item_id, current_user.id, require_edit=True)
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item não encontrado ou sem permissão"
        )
    
    # Separa campos dinâmicos se existirem
    campos_update = None
    dados_dict = dados.model_dump(exclude_unset=True)
    
    if "campos" in dados_dict:
        campos_update = dados_dict.pop("campos")
    
    # Atualiza campos do item
    for field, value in dados_dict.items():
        setattr(item, field, value)
    
    # Se houver atualização de campos dinâmicos
    if campos_update is not None:
        # Remove campos existentes
        db.query(CampoDinamico).filter(CampoDinamico.item_id == item.id).delete()
        
        # Adiciona novos campos
        for campo in campos_update:
            # Pydantic model to dict
            campo_dict = campo if isinstance(campo, dict) else campo.model_dump()
            
            value = campo_dict.get("value")
            # Criptografa se for sensível
            if campo_dict.get("is_sensitive") and value:
                value = CryptoService.encrypt(value)
            
            db_campo = CampoDinamico(
                item_id=item.id,
                label=campo_dict.get("label"),
                value=value,
                field_type=campo_dict.get("field_type"),
                is_sensitive=campo_dict.get("is_sensitive"),
                ordem=campo_dict.get("ordem", "0")
            )
            db.add(db_campo)
    
    db.commit()
    db.refresh(item)
    
    # Carrega relacionamentos
    item = db.query(ItemCofre).options(
        joinedload(ItemCofre.campos),
        joinedload(ItemCofre.categoria)
    ).filter(ItemCofre.id == item_id).first()
    
    # Descriptografa valores sensíveis
    for campo in item.campos:
        if campo.is_sensitive and campo.value:
            campo.value = CryptoService.decrypt(campo.value)
    
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_item(
    item_id: str,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Exclui um item do cofre (soft delete).
    Apenas o dono pode excluir.
    """
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
    
    item.soft_delete()
    db.commit()


@router.post("/{item_id}/favorito", response_model=ItemCofreResponse)
def toggle_favorito(
    item_id: str,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Alterna o status de favorito de um item.
    """
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
    
    item.favorito = not item.favorito
    db.commit()
    db.refresh(item)
    
    return item
