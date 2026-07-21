-- CreateTable NotaAdjunto
CREATE TABLE "NotaAdjunto" (
  "id"            TEXT NOT NULL,
  "notaId"        TEXT NOT NULL,
  "nombreArchivo" TEXT NOT NULL,
  "tipoArchivo"   TEXT NOT NULL,
  "tamano"        INTEGER NOT NULL,
  "datos"         BYTEA NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotaAdjunto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotaAdjunto_notaId_idx" ON "NotaAdjunto"("notaId");

ALTER TABLE "NotaAdjunto" ADD CONSTRAINT "NotaAdjunto_notaId_fkey"
  FOREIGN KEY ("notaId") REFERENCES "Nota"("id") ON DELETE CASCADE ON UPDATE CASCADE;
