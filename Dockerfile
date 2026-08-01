FROM python:3.12-slim

WORKDIR /app

# Instala dependências básicas do sistema necessárias
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia os arquivos de dependência
COPY requirements.txt .

# Instala os pacotes python, garantindo o psycopg2-binary   && \ pip install --no-cache-dir psycopg2-binary
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código da aplicação
COPY . .

# Explicita a porta exposta
EXPOSE 8002

# Comando para iniciar o servidor FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
