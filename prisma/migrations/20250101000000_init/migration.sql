-- Migración inicial: crea todas las tablas de la app de Gestión de Envíos

CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERADOR');

CREATE TYPE "EstadoEnvio" AS ENUM (
  'EN_TRANSITO',
  'RETRASADO',
  'PERDIDO',
  'EN_INVESTIGACION',
  'ENCONTRADO',
  'ENTREGADO',
  'DEVUELTO',
  'RESUELTO'
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'OPERADOR',
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Envio" (
  "id" TEXT NOT NULL,
  "numeroSeguimiento" TEXT NOT NULL,
  "mensajero" TEXT NOT NULL,
  "estado" "EstadoEnvio" NOT NULL DEFAULT 'EN_TRANSITO',
  "motivo" TEXT,
  "descripcion" TEXT,
  "destinatario" TEXT,
  "direccion" TEXT,
  "fechaEnvio" TIMESTAMP(3),
  "ultimaActualizacion" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "creadoPorId" TEXT NOT NULL,
  CONSTRAINT "Envio_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Envio_numeroSeguimiento_key" ON "Envio"("numeroSeguimiento");
CREATE INDEX "Envio_estado_idx" ON "Envio"("estado");
CREATE INDEX "Envio_mensajero_idx" ON "Envio"("mensajero");
CREATE INDEX "Envio_numeroSeguimiento_idx" ON "Envio"("numeroSeguimiento");

CREATE TABLE "CambioEstado" (
  "id" TEXT NOT NULL,
  "envioId" TEXT NOT NULL,
  "estadoAnterior" "EstadoEnvio",
  "estadoNuevo" "EstadoEnvio" NOT NULL,
  "nota" TEXT,
  "creadoPorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CambioEstado_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CambioEstado_envioId_idx" ON "CambioEstado"("envioId");

CREATE TABLE "Comentario" (
  "id" TEXT NOT NULL,
  "envioId" TEXT NOT NULL,
  "texto" TEXT NOT NULL,
  "creadoPorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Comentario_envioId_idx" ON "Comentario"("envioId");

CREATE TABLE "Adjunto" (
  "id" TEXT NOT NULL,
  "envioId" TEXT NOT NULL,
  "nombreArchivo" TEXT NOT NULL,
  "tipoArchivo" TEXT NOT NULL,
  "tamano" INTEGER NOT NULL,
  "datos" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Adjunto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Adjunto_envioId_idx" ON "Adjunto"("envioId");

-- Claves foráneas

ALTER TABLE "Envio" ADD CONSTRAINT "Envio_creadoPorId_fkey"
  FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CambioEstado" ADD CONSTRAINT "CambioEstado_envioId_fkey"
  FOREIGN KEY ("envioId") REFERENCES "Envio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CambioEstado" ADD CONSTRAINT "CambioEstado_creadoPorId_fkey"
  FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_envioId_fkey"
  FOREIGN KEY ("envioId") REFERENCES "Envio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_creadoPorId_fkey"
  FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Adjunto" ADD CONSTRAINT "Adjunto_envioId_fkey"
  FOREIGN KEY ("envioId") REFERENCES "Envio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
