"""
Security Key - Cofre Digital Familiar
API FastAPI para gerenciar senhas e documentos da família
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.lifespan import lifespan
from app.routers import (
    auth_router,
    campos_router,
    categorias_router,
    itens_router,
    permissoes_router,
    usuarios_router,
)

settings = get_settings()

# Diretório base da aplicação
BASE_DIR = Path(__file__).resolve().parent


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
    redoc_url="/redoc",
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
app.mount("/static/", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

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
    Dashboard principal - Interface do usuario responsiva.
    Um unico template serve para desktop e mobile via CSS responsive.
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
        "status": "online",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check da aplicação
    """
    return {"status": "healthy"}
