"""
Security Key - Lifecycle Management
Gerencia o ciclo de vida da aplicação (startup/shutdown)
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerencia o ciclo de vida da aplicação.
    Cria as tabelas no início e limpa recursos no final.
    """
    # Startup: Cria tabelas
    from app.database import create_tables, SessionLocal
    from app.models.categoria import Categoria

    create_tables()
    print("✅ Banco de dados inicializado")

    # Cria categorias padrão
    db = SessionLocal()
    try:
        categorias_padrao = [
            {
                "nome": "Bancos",
                "icone": "bank",
                "cor": "#10b981",
                "descricao": "Contas bancárias e cartões",
            },
            {
                "nome": "Redes Sociais",
                "icone": "share",
                "cor": "#6366f1",
                "descricao": "Facebook, Instagram, Twitter, etc",
            },
            {
                "nome": "Documentos",
                "icone": "file",
                "cor": "#f59e0b",
                "descricao": "RG, CPF, CNH e outros documentos",
            },
            {
                "nome": "Saúde",
                "icone": "heart",
                "cor": "#ef4444",
                "descricao": "Planos de saúde, convênios",
            },
            {
                "nome": "Emails",
                "icone": "mail",
                "cor": "#3b82f6",
                "descricao": "Contas de email",
            },
            {
                "nome": "Trabalho",
                "icone": "briefcase",
                "cor": "#8b5cf6",
                "descricao": "Acessos corporativos",
            },
            {
                "nome": "Streaming",
                "icone": "tv",
                "cor": "#ec4899",
                "descricao": "Netflix, Spotify, Disney+, etc",
            },
            {
                "nome": "Outros",
                "icone": "folder",
                "cor": "#6b7280",
                "descricao": "Outros itens",
            },
        ]

        categorias_criadas = 0
        for cat_data in categorias_padrao:
            existing = (
                db.query(Categoria).filter(Categoria.nome == cat_data["nome"]).first()
            )
            if not existing:
                categoria = Categoria(**cat_data)
                db.add(categoria)
                categorias_criadas += 1
        db.commit()
        
        if categorias_criadas > 0:
            print(f"✅ {categorias_criadas} categorias padrão criadas")
        else:
            print("✅ Categorias padrão já existem")
    finally:
        db.close()

    yield

    # Shutdown
    print("👋 Encerrando aplicação...")
