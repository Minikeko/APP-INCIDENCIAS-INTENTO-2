-- Tablero Kanban: nuevo enum y campo en Envio
CREATE TYPE "ColumnaTablero" AS ENUM ('PENDIENTE', 'SE_ACEPTA', 'NO_SE_ACEPTA', 'SOLUCIONADO');

ALTER TABLE "Envio" ADD COLUMN "columnaTablero" "ColumnaTablero" NOT NULL DEFAULT 'PENDIENTE';

-- Adjuntos en mensajes de chat
ALTER TABLE "Mensaje" ALTER COLUMN "texto" DROP NOT NULL;
ALTER TABLE "Mensaje" ADD COLUMN "adjuntoNombre" TEXT;
ALTER TABLE "Mensaje" ADD COLUMN "adjuntoTipo"   TEXT;
ALTER TABLE "Mensaje" ADD COLUMN "adjuntoDatos"  BYTEA;
