-- Tablas nuevas para Denuncias, Gastos varios y Chats

CREATE TABLE "Denuncia" (
  "id" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "descripcion" TEXT,
  "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivoOriginalNombre" TEXT,
  "archivoOriginalTipo" TEXT,
  "archivoOriginalDatos" BYTEA,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "creadoPorId" TEXT NOT NULL,
  CONSTRAINT "Denuncia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Denuncia_fecha_idx" ON "Denuncia"("fecha");

CREATE TABLE "DenunciaEnvio" (
  "id" TEXT NOT NULL,
  "denunciaId" TEXT NOT NULL,
  "envioId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DenunciaEnvio_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DenunciaEnvio_denunciaId_envioId_key" ON "DenunciaEnvio"("denunciaId", "envioId");
CREATE INDEX "DenunciaEnvio_envioId_idx" ON "DenunciaEnvio"("envioId");

CREATE TYPE "CategoriaGasto" AS ENUM (
  'COMBUSTIBLE',
  'MATERIAL_SUMINISTROS',
  'MANTENIMIENTO_VEHICULOS',
  'DIETAS_DESPLAZAMIENTOS',
  'MATERIAL_OFICINA',
  'OTROS'
);

CREATE TABLE "Gasto" (
  "id" TEXT NOT NULL,
  "nombreArchivo" TEXT NOT NULL,
  "tipoArchivo" TEXT NOT NULL,
  "tamano" INTEGER NOT NULL,
  "datos" BYTEA NOT NULL,
  "fecha" TIMESTAMP(3) NOT NULL,
  "importe" DECIMAL(12,2) NOT NULL,
  "categoria" "CategoriaGasto" NOT NULL,
  "descripcion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "subidoPorId" TEXT NOT NULL,
  CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Gasto_fecha_idx" ON "Gasto"("fecha");
CREATE INDEX "Gasto_categoria_idx" ON "Gasto"("categoria");

CREATE TYPE "TipoChat" AS ENUM ('PRIVADO', 'GRUPAL');

CREATE TABLE "Chat" (
  "id" TEXT NOT NULL,
  "tipo" "TipoChat" NOT NULL,
  "nombre" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatParticipante" (
  "id" TEXT NOT NULL,
  "chatId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "ChatParticipante_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChatParticipante_chatId_userId_key" ON "ChatParticipante"("chatId", "userId");
CREATE INDEX "ChatParticipante_userId_idx" ON "ChatParticipante"("userId");

CREATE TABLE "Mensaje" (
  "id" TEXT NOT NULL,
  "chatId" TEXT NOT NULL,
  "texto" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "autorId" TEXT NOT NULL,
  CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Mensaje_chatId_createdAt_idx" ON "Mensaje"("chatId", "createdAt");

-- Claves foráneas

ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_creadoPorId_fkey"
  FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DenunciaEnvio" ADD CONSTRAINT "DenunciaEnvio_denunciaId_fkey"
  FOREIGN KEY ("denunciaId") REFERENCES "Denuncia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DenunciaEnvio" ADD CONSTRAINT "DenunciaEnvio_envioId_fkey"
  FOREIGN KEY ("envioId") REFERENCES "Envio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_subidoPorId_fkey"
  FOREIGN KEY ("subidoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ChatParticipante" ADD CONSTRAINT "ChatParticipante_chatId_fkey"
  FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatParticipante" ADD CONSTRAINT "ChatParticipante_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_chatId_fkey"
  FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_autorId_fkey"
  FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
