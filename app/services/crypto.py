"""
Serviço de Criptografia - Para campos sensíveis
"""
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from app.config import get_settings

settings = get_settings()


class CryptoService:
    """
    Serviço para criptografar e descriptografar valores sensíveis.
    Usa Fernet (AES 128-bit) para criptografia simétrica.
    """
    
    _fernet: Fernet = None
    
    @classmethod
    def _get_fernet(cls) -> Fernet:
        """Retorna instância do Fernet (singleton)"""
        if cls._fernet is None:
            # Deriva uma chave de 32 bytes a partir da chave de configuração
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b"security_key_salt",  # Em produção, use um salt único
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(
                kdf.derive(settings.ENCRYPTION_KEY.encode())
            )
            cls._fernet = Fernet(key)
        return cls._fernet
    
    @classmethod
    def encrypt(cls, value: str) -> str:
        """
        Criptografa um valor string.
        Retorna o valor criptografado em base64.
        """
        if not value:
            return value
        
        fernet = cls._get_fernet()
        encrypted = fernet.encrypt(value.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    
    @classmethod
    def decrypt(cls, encrypted_value: str) -> str:
        """
        Descriptografa um valor criptografado.
        Retorna o valor original.
        """
        if not encrypted_value:
            return encrypted_value
        
        try:
            fernet = cls._get_fernet()
            decoded = base64.urlsafe_b64decode(encrypted_value.encode())
            decrypted = fernet.decrypt(decoded)
            return decrypted.decode()
        except Exception:
            # Se falhar, retorna o valor original (pode não estar criptografado)
            return encrypted_value
    
    @classmethod
    def is_encrypted(cls, value: str) -> bool:
        """
        Tenta verificar se um valor está criptografado.
        """
        if not value:
            return False
        
        try:
            decoded = base64.urlsafe_b64decode(value.encode())
            fernet = cls._get_fernet()
            fernet.decrypt(decoded)
            return True
        except Exception:
            return False
