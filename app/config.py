"""
Configurações da aplicação Security Key
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configurações carregadas de variáveis de ambiente"""
    
    # Aplicação
    APP_NAME: str = "Security Key"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Banco de dados
    DATABASE_URL: str = "sqlite:///./security_key.db"
    
    # JWT
    SECRET_KEY: str = "sua-chave-secreta-super-segura-mude-em-producao"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Criptografia de campos sensíveis
    ENCRYPTION_KEY: str = "chave-de-criptografia-32-bytes!!"  # Deve ter 32 bytes
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    """Retorna as configurações cacheadas"""
    return Settings()
