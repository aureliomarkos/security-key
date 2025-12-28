# Security Key - Cofre Digital Familiar

## 🔐 Sobre

API Backend para um cofre digital de senhas e documentos familiares. Permite armazenar e compartilhar informações sensíveis de forma segura entre membros da família.

## ✨ Funcionalidades

- **Autenticação JWT** - Registro e login seguros
- **Categorias** - Organize por tipo (Bancos, Redes Sociais, Documentos, etc.)
- **Itens do Cofre** - Armazene qualquer tipo de informação
- **Campos Dinâmicos** - Flexibilidade total nos dados armazenados
- **Compartilhamento** - Compartilhe itens com familiares
- **Criptografia AES** - Campos sensíveis são criptografados no banco
- **Soft Delete** - Nada é perdido definitivamente
- **Auditoria** - Campos created_at e updated_at em todos os registros

## 🚀 Instalação

### 1. Clone o repositório e entre na pasta
```bash
cd security-key
```

### 2. Crie e ative o ambiente virtual
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
python -m venv venv
source venv/bin/activate
```

### 3. Instale as dependências
```bash
pip install -r requirements.txt
```

### 4. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
copy .env.example .env

# Edite o .env com suas configurações
# IMPORTANTE: Mude SECRET_KEY e ENCRYPTION_KEY em produção!
```

### 5. Execute a aplicação
```bash
uvicorn app.main:app --reload
```

A API estará disponível em: http://localhost:8000

## 📚 Documentação da API

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🗂️ Estrutura do Projeto

```
security-key/
├── app/
│   ├── __init__.py
│   ├── main.py              # Aplicação FastAPI
│   ├── config.py            # Configurações
│   ├── database.py          # Conexão SQLAlchemy
│   ├── models/              # Modelos SQLAlchemy
│   │   ├── __init__.py
│   │   ├── base.py          # Mixin com campos de auditoria
│   │   ├── usuario.py
│   │   ├── categoria.py
│   │   ├── item_cofre.py
│   │   ├── campo_dinamico.py
│   │   └── permissao.py
│   ├── schemas/             # Schemas Pydantic
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── usuario.py
│   │   ├── categoria.py
│   │   ├── item_cofre.py
│   │   ├── campo_dinamico.py
│   │   └── permissao.py
│   ├── routers/             # Endpoints da API
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── usuarios.py
│   │   ├── categorias.py
│   │   ├── itens.py
│   │   ├── campos.py
│   │   └── permissoes.py
│   └── services/            # Serviços
│       ├── __init__.py
│       ├── auth.py          # Autenticação JWT
│       └── crypto.py        # Criptografia AES
├── requirements.txt
└── README.md
```

## 🔒 Segurança

1. **Senhas**: Hash com bcrypt
2. **Tokens**: JWT com expiração configurável
3. **Campos Sensíveis**: Criptografia AES (Fernet)
4. **Soft Delete**: Dados nunca são perdidos definitivamente

## 📝 Exemplos de Uso

### Registrar usuário
```bash
curl -X POST "http://localhost:8000/api/auth/registro" \
  -H "Content-Type: application/json" \
  -d '{"nome": "João", "email": "joao@email.com", "password": "senha123"}'
```

### Login
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=joao@email.com&password=senha123"
```

### Criar item no cofre
```bash
curl -X POST "http://localhost:8000/api/itens" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Banco Itaú",
    "category_id": "ID_DA_CATEGORIA",
    "favorito": true,
    "campos": [
      {"label": "Agência", "value": "1234", "field_type": "texto"},
      {"label": "Conta", "value": "12345-6", "field_type": "texto"},
      {"label": "Senha", "value": "minha_senha", "is_sensitive": true, "field_type": "senha"}
    ]
  }'
```

## 📊 Modelo de Dados

### Usuários
- Controle de acesso ao app com autenticação JWT

### Categorias
- Organização: Bancos, Redes Sociais, Documentos, Saúde, etc.

### Itens do Cofre
- Registro principal com título, notas e status de favorito

### Campos Dinâmicos
- Flexibilidade total: adicione qualquer campo (usuário, senha, CPF, data, etc.)
- Flag `is_sensitive` para criptografia automática

### Permissões
- Compartilhamento com níveis: Visualizar ou Editar

## 🛠️ Tecnologias

- **Python 3.10+**
- **FastAPI** - Framework web moderno
- **SQLAlchemy 2.0** - ORM
- **Pydantic 2.0** - Validação de dados
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas
- **Fernet (AES)** - Criptografia de campos

## 📄 Licença

MIT
