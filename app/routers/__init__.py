"""
Routers do Security Key
"""
from app.routers.auth import router as auth_router
from app.routers.usuarios import router as usuarios_router
from app.routers.categorias import router as categorias_router
from app.routers.itens import router as itens_router
from app.routers.campos import router as campos_router
from app.routers.permissoes import router as permissoes_router

__all__ = [
    "auth_router",
    "usuarios_router",
    "categorias_router",
    "itens_router",
    "campos_router",
    "permissoes_router"
]
