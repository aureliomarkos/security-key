"""
Configurações da aplicação Security Key
"""
from pydantic_settings import BaseSettings
from functools import lru_cache

from dotenv import load_dotenv # Importação para carregar o .env
import os

load_dotenv()

class Settings(BaseSettings):
    """Configurações carregadas de variáveis de ambiente"""
    
    # Aplicação
    APP_NAME: str = "Security Key"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Banco de dados
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Criptografia de campos sensíveis
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    """Retorna as configurações cacheadas"""
    return Settings()
