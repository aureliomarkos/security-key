"""
Router de Categorias - CRUD
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.categoria import Categoria
from app.models.usuario import Usuario
from app.schemas.categoria import CategoriaCreate, CategoriaUpdate, CategoriaResponse
from app.services.auth import get_current_active_user

router = APIRouter(prefix="/api/categorias", tags=["Categorias"])


@router.get("", response_model=List[CategoriaResponse])
def listar_categorias(
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lista todas as categorias disponíveis.
    """
    # Filtra categorias globais (usuario_id=None) ou do usuário atual
    categorias = db.query(Categoria).filter(
        Categoria.deleted_at.is_(None),
        (Categoria.usuario_id == None) | (Categoria.usuario_id == current_user.id)
    ).order_by(Categoria.nome).all()
    
    return categorias


@router.post("", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
def criar_categoria(
    categoria: CategoriaCreate,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Cria uma nova categoria.
    """
    # Verifica se nome já existe
    # Verifica se nome já existe para este usuário (permitimos duplicar global se quiser sobrescrever visualmente)
    # ou podemos bloquear se já existe qualquer um com esse nome visível.
    # Vamos bloquear apenas se já existe UMA DO PRÓPRIO USUÁRIO com esse nome.
    
    existing = db.query(Categoria).filter(
        Categoria.nome == categoria.nome,
        Categoria.usuario_id == current_user.id,
        Categoria.deleted_at.is_(None)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você já possui uma categoria com este nome"
        )
    
    # Cria com o ID do usuário
    data = categoria.model_dump()
    data["usuario_id"] = current_user.id
    db_categoria = Categoria(**data)
    db.add(db_categoria)
    db.commit()
    db.refresh(db_categoria)
    
    return db_categoria


@router.get("/{categoria_id}", response_model=CategoriaResponse)
def obter_categoria(
    categoria_id: str,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Obtém uma categoria específica.
    """
    categoria = db.query(Categoria).filter(
        Categoria.id == categoria_id,
        Categoria.deleted_at.is_(None)
    ).first()
    
    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada"
        )
    
    return categoria


@router.put("/{categoria_id}", response_model=CategoriaResponse)
def atualizar_categoria(
    categoria_id: str,
    dados: CategoriaUpdate,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza uma categoria.
    """
    categoria = db.query(Categoria).filter(
        Categoria.id == categoria_id,
        Categoria.deleted_at.is_(None)
    ).first()
    
    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada"
        )
    
    # Verifica permissão (não pode editar globais)
    if not categoria.usuario_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não é permitido alterar categorias padrão do sistema"
        )
        
    # Verifica se a categoria pertence ao usuário
    if categoria.usuario_id != current_user.id:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para alterar esta categoria"
        )

    # Verifica se novo nome já existe para este usuário
    if dados.nome and dados.nome != categoria.nome:
        existing = db.query(Categoria).filter(
            Categoria.nome == dados.nome,
            Categoria.usuario_id == current_user.id,
            Categoria.deleted_at.is_(None),
            Categoria.id != categoria_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você já possui uma categoria com este nome"
            )
    
    # Atualiza campos
    for field, value in dados.model_dump(exclude_unset=True).items():
        setattr(categoria, field, value)
    
    db.commit()
    db.refresh(categoria)
    
    return categoria


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_categoria(
    categoria_id: str,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Exclui uma categoria (soft delete).
    """
    categoria = db.query(Categoria).filter(
        Categoria.id == categoria_id,
        Categoria.deleted_at.is_(None)
    ).first()
    
    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada"
        )
    
    # Verifica permissão (não pode excluir globais)
    if not categoria.usuario_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não é permitido excluir categorias padrão do sistema"
        )
        
    # Verifica se pertence ao usuário
    if categoria.usuario_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para excluir esta categoria"
        )

    # TODO: Verificar se existem itens nesta categoria antes de excluir?
    # Por enquanto, mantemos lógica simples. Soft delete.
    
    categoria.soft_delete()
    db.commit()
