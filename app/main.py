"""
Security Key - Cofre Digital Familiar
API FastAPI para gerenciar senhas e documentos da família
"""
import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

from app.config import get_settings
from app.database import create_tables
from app.routers import (
    auth_router,
    usuarios_router,
    categorias_router,
    itens_router,
    campos_router,
    permissoes_router
)

settings = get_settings()

# Diretório base da aplicação
BASE_DIR = Path(__file__).resolve().parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerencia o ciclo de vida da aplicação.
    Cria as tabelas no início e limpa recursos no final.
    """
    # Startup: Cria tabelas
    create_tables()
    print("✅ Banco de dados inicializado")
    
    # Cria categorias padrão
    from app.database import SessionLocal
    from app.models.categoria import Categoria
    
    db = SessionLocal()
    try:
        categorias_padrao = [
            {"nome": "Bancos", "icone": "bank", "cor": "#10b981", "descricao": "Contas bancárias e cartões"},
            {"nome": "Redes Sociais", "icone": "share", "cor": "#6366f1", "descricao": "Facebook, Instagram, Twitter, etc"},
            {"nome": "Documentos", "icone": "file", "cor": "#f59e0b", "descricao": "RG, CPF, CNH e outros documentos"},
            {"nome": "Saúde", "icone": "heart", "cor": "#ef4444", "descricao": "Planos de saúde, convênios"},
            {"nome": "Emails", "icone": "mail", "cor": "#3b82f6", "descricao": "Contas de email"},
            {"nome": "Trabalho", "icone": "briefcase", "cor": "#8b5cf6", "descricao": "Acessos corporativos"},
            {"nome": "Streaming", "icone": "tv", "cor": "#ec4899", "descricao": "Netflix, Spotify, Disney+, etc"},
            {"nome": "Outros", "icone": "folder", "cor": "#6b7280", "descricao": "Outros itens"},
        ]
        
        for cat_data in categorias_padrao:
            existing = db.query(Categoria).filter(Categoria.nome == cat_data["nome"]).first()
            if not existing:
                categoria = Categoria(**cat_data)
                db.add(categoria)
                db.commit()
                print("✅ Categorias padrão criadas")
    finally:
        db.close()
    
    yield
    
    # Shutdown
    print("👋 Encerrando aplicação...")


# Cria a aplicação FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    ## 🔐 Security Key - Cofre Digital Familiar
    
    API para gerenciar senhas, documentos e informações sensíveis da família.
    
    ### Funcionalidades:
    
    - **Autenticação** - Registro e login com JWT
    - **Categorias** - Organize seus itens por tipo
    - **Itens do Cofre** - Armazene senhas, documentos e informações
    - **Campos Dinâmicos** - Adicione qualquer tipo de informação
    - **Compartilhamento** - Compartilhe itens com familiares
    - **Criptografia** - Campos sensíveis são criptografados
    """,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique as origens permitidas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monta arquivos estáticos
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# Registra os routers
app.include_router(auth_router)
app.include_router(usuarios_router)
app.include_router(categorias_router)
app.include_router(itens_router)
app.include_router(campos_router)
app.include_router(permissoes_router)


@app.get("/", response_class=HTMLResponse, tags=["Dashboard"])
def dashboard():
    """
    Dashboard principal - Interface do usuário
    """
    template_path = BASE_DIR / "templates" / "dashboard.html"
    with open(template_path, "r", encoding="utf-8") as f:
        return f.read()


@app.get("/api", tags=["API"])
def api_info():
    """
    Informações da API
    """
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "online"
    }


@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check da aplicação
    """
    return {"status": "healthy"}
