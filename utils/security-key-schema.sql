BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "campos_dinamicos" (
	"id"	VARCHAR(36) NOT NULL,
	"item_id"	VARCHAR(36) NOT NULL,
	"label"	VARCHAR(100) NOT NULL,
	"value"	TEXT,
	"field_type"	VARCHAR(20),
	"is_sensitive"	BOOLEAN,
	"ordem"	VARCHAR(10),
	"created_at"	DATETIME NOT NULL,
	"updated_at"	DATETIME NOT NULL,
	"deleted_at"	DATETIME,
	PRIMARY KEY("id"),
	FOREIGN KEY("item_id") REFERENCES "itens_cofre"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "categorias" (
	"id"	VARCHAR(36) NOT NULL,
	"nome"	VARCHAR(100) NOT NULL,
	"icone"	VARCHAR(50),
	"descricao"	VARCHAR(255),
	"cor"	VARCHAR(7),
	"created_at"	DATETIME NOT NULL,
	"updated_at"	DATETIME NOT NULL,
	"deleted_at"	DATETIME,
	PRIMARY KEY("id"),
	UNIQUE("nome")
);
CREATE TABLE IF NOT EXISTS "itens_cofre" (
	"id"	VARCHAR(36) NOT NULL,
	"user_id"	VARCHAR(36) NOT NULL,
	"category_id"	VARCHAR(36),
	"titulo"	VARCHAR(200) NOT NULL,
	"nota_adicional"	TEXT,
	"favorito"	BOOLEAN,
	"created_at"	DATETIME NOT NULL,
	"updated_at"	DATETIME NOT NULL,
	"deleted_at"	DATETIME,
	PRIMARY KEY("id"),
	FOREIGN KEY("category_id") REFERENCES "categorias"("id") ON DELETE SET NULL,
	FOREIGN KEY("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "permissoes" (
	"id"	VARCHAR(36) NOT NULL,
	"item_id"	VARCHAR(36) NOT NULL,
	"shared_with_user_id"	VARCHAR(36) NOT NULL,
	"nivel_acesso"	VARCHAR(20) NOT NULL,
	"created_at"	DATETIME NOT NULL,
	"updated_at"	DATETIME NOT NULL,
	"deleted_at"	DATETIME,
	PRIMARY KEY("id"),
	FOREIGN KEY("item_id") REFERENCES "itens_cofre"("id") ON DELETE CASCADE,
	FOREIGN KEY("shared_with_user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "usuarios" (
	"id"	VARCHAR(36) NOT NULL,
	"nome"	VARCHAR(100) NOT NULL,
	"email"	VARCHAR(255) NOT NULL,
	"password_hash"	VARCHAR(255) NOT NULL,
	"is_active"	BOOLEAN,
	"created_at"	DATETIME NOT NULL,
	"updated_at"	DATETIME NOT NULL,
	"deleted_at"	DATETIME,
	PRIMARY KEY("id")
);
CREATE INDEX IF NOT EXISTS "ix_campos_dinamicos_item_id" ON "campos_dinamicos" (
	"item_id"
);
CREATE INDEX IF NOT EXISTS "ix_itens_cofre_category_id" ON "itens_cofre" (
	"category_id"
);
CREATE INDEX IF NOT EXISTS "ix_itens_cofre_user_id" ON "itens_cofre" (
	"user_id"
);
CREATE INDEX IF NOT EXISTS "ix_permissoes_item_id" ON "permissoes" (
	"item_id"
);
CREATE INDEX IF NOT EXISTS "ix_permissoes_shared_with_user_id" ON "permissoes" (
	"shared_with_user_id"
);
CREATE UNIQUE INDEX IF NOT EXISTS "ix_usuarios_email" ON "usuarios" (
	"email"
);
COMMIT;
