-- Migración: añade tablas para Tarifas de comerciales, Facturación y Registro de actividad

CREATE TYPE "TipoAccion" AS ENUM (
  'LOGIN',
  'ENVIO_CREADO',
  'ENVIO_EDITADO',
  'ENVIO_ELIMINADO',
  'ESTADO_CAMBIADO',
  'COMENTARIO_ANADIDO',
  'ADJUNTO_SUBIDO',
  'ADJUNTO_ELIMINADO',
  'USUARIO_CREADO',
  'USUARIO_ACTUALIZADO',
  'DOCUMENTO_SUBIDO',
  'DOCUMENTO_ELIMINADO'
);

CREATE TABLE "DocumentoTarifa" (
  "id" TEXT NOT NULL,
  "nombreArchivo" TEXT NOT NULL,
  "tipoArchivo" TEXT NOT NULL,
  "tamano" INTEGER NOT NULL,
  "datos" BYTEA NOT NULL,
  "mes" INTEGER NOT NULL,
  "anio" INTEGER NOT NULL,
  "comercial" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "subidoPorId" TEXT NOT NULL,
  CONSTRAINT "DocumentoTarifa_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentoTarifa_anio_mes_idx" ON "DocumentoTarifa"("anio", "mes");
CREATE INDEX "DocumentoTarifa_comercial_idx" ON "DocumentoTarifa"("comercial");

CREATE TABLE "DocumentoFactura" (
  "id" TEXT NOT NULL,
  "nombreArchivo" TEXT NOT NULL,
  "tipoArchivo" TEXT NOT NULL,
  "tamano" INTEGER NOT NULL,
  "datos" BYTEA NOT NULL,
  "mes" INTEGER NOT NULL,
  "anio" INTEGER NOT NULL,
  "clienteProveedor" TEXT NOT NULL,
  "numeroFactura" TEXT,
  "importe" DECIMAL(12,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "subidoPorId" TEXT NOT NULL,
  CONSTRAINT "DocumentoFactura_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentoFactura_anio_mes_idx" ON "DocumentoFactura"("anio", "mes");
CREATE INDEX "DocumentoFactura_clienteProveedor_idx" ON "DocumentoFactura"("clienteProveedor");

CREATE TABLE "RegistroActividad" (
  "id" TEXT NOT NULL,
  "tipo" "TipoAccion" NOT NULL,
  "descripcion" TEXT NOT NULL,
  "entidadId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usuarioId" TEXT NOT NULL,
  CONSTRAINT "RegistroActividad_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RegistroActividad_tipo_idx" ON "RegistroActividad"("tipo");
CREATE INDEX "RegistroActividad_usuarioId_idx" ON "RegistroActividad"("usuarioId");
CREATE INDEX "RegistroActividad_createdAt_idx" ON "RegistroActividad"("createdAt");

-- Claves foráneas

ALTER TABLE "DocumentoTarifa" ADD CONSTRAINT "DocumentoTarifa_subidoPorId_fkey"
  FOREIGN KEY ("subidoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DocumentoFactura" ADD CONSTRAINT "DocumentoFactura_subidoPorId_fkey"
  FOREIGN KEY ("subidoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RegistroActividad" ADD CONSTRAINT "RegistroActividad_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
