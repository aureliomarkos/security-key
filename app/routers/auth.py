"""
Router de Autenticação - Login, Registro, Perfil
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.schemas.auth import Token
from app.services.auth import AuthService, get_current_active_user
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/auth", tags=["Autenticação"])


@router.post("/registro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def registrar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    """
    Registra um novo usuário no sistema.
    """
    # Verifica se email já existe
    existing = db.query(Usuario).filter(
        Usuario.email == usuario.email,
        Usuario.deleted_at.is_(None)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    # Cria novo usuário
    db_user = Usuario(
        nome=usuario.nome,
        email=usuario.email,
        password_hash=AuthService.get_password_hash(usuario.password)
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Autentica usuário e retorna token JWT.
    Use o email como username.
    """
    user = AuthService.authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )
    
    # Cria token de acesso
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UsuarioResponse)
def get_perfil(current_user: Usuario = Depends(get_current_active_user)):
    """
    Retorna os dados do usuário autenticado.
    """
    return current_user


@router.put("/me", response_model=UsuarioResponse)
def atualizar_perfil(
    dados: UsuarioUpdate,
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza os dados do usuário autenticado.
    """
    # Verifica se novo email já existe
    if dados.email and dados.email != current_user.email:
        existing = db.query(Usuario).filter(
            Usuario.email == dados.email,
            Usuario.deleted_at.is_(None),
            Usuario.id != current_user.id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já cadastrado"
            )
    
    # Atualiza campos
    if dados.nome is not None:
        current_user.nome = dados.nome
    if dados.email is not None:
        current_user.email = dados.email
    if dados.password is not None:
        current_user.password_hash = AuthService.get_password_hash(dados.password)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user
