-- Mejoras completas: avatares, notificaciones, reacciones, responsable, edición mensajes

-- Avatar en User
ALTER TABLE "User" ADD COLUMN "avatarDatos" BYTEA;
ALTER TABLE "User" ADD COLUMN "avatarTipo"  TEXT;

-- Responsable y asignado en Envio
ALTER TABLE "Envio" ADD COLUMN "responsable"  TEXT;
ALTER TABLE "Envio" ADD COLUMN "asignadoAId"  TEXT;
CREATE INDEX "Envio_asignadoAId_idx" ON "Envio"("asignadoAId");
ALTER TABLE "Envio" ADD CONSTRAINT "Envio_asignadoAId_fkey"
  FOREIGN KEY ("asignadoAId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Edición de mensajes
ALTER TABLE "Mensaje" ADD COLUMN "editado"   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Mensaje" ADD COLUMN "editadoAt" TIMESTAMP(3);

-- Preferencias de usuario
CREATE TABLE "PreferenciaUsuario" (
  "id"                        TEXT NOT NULL,
  "userId"                    TEXT NOT NULL,
  "tema"                      TEXT NOT NULL DEFAULT 'dark',
  "notificacionesSilenciadas" TEXT NOT NULL DEFAULT '[]',
  "updatedAt"                 TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PreferenciaUsuario_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PreferenciaUsuario_userId_key" ON "PreferenciaUsuario"("userId");
ALTER TABLE "PreferenciaUsuario" ADD CONSTRAINT "PreferenciaUsuario_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Notificaciones
CREATE TYPE "TipoNotificacion" AS ENUM (
  'MENSAJE_NUEVO', 'MENCION', 'ESTADO_ENVIO_CAMBIADO', 'ENVIO_ASIGNADO'
);

CREATE TABLE "Notificacion" (
  "id"        TEXT NOT NULL,
  "tipo"      "TipoNotificacion" NOT NULL,
  "titulo"    TEXT NOT NULL,
  "cuerpo"    TEXT NOT NULL,
  "leida"     BOOLEAN NOT NULL DEFAULT false,
  "url"       TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId"    TEXT NOT NULL,
  CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notificacion_userId_leida_idx" ON "Notificacion"("userId", "leida");
CREATE INDEX "Notificacion_createdAt_idx" ON "Notificacion"("createdAt");
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reacciones a mensajes
CREATE TABLE "Reaccion" (
  "id"        TEXT NOT NULL,
  "mensajeId" TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "emoji"     TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Reaccion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Reaccion_mensajeId_userId_emoji_key" ON "Reaccion"("mensajeId", "userId", "emoji");
CREATE INDEX "Reaccion_mensajeId_idx" ON "Reaccion"("mensajeId");
ALTER TABLE "Reaccion" ADD CONSTRAINT "Reaccion_mensajeId_fkey"
  FOREIGN KEY ("mensajeId") REFERENCES "Mensaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reaccion" ADD CONSTRAINT "Reaccion_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
