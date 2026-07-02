-- Mejoras del chat: tabla MensajeVisto (✓✓ de leído) y campo eliminado en Chat

ALTER TABLE "Chat" ADD COLUMN "eliminado" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "MensajeVisto" (
  "id" TEXT NOT NULL,
  "mensajeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "vistoPor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MensajeVisto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MensajeVisto_mensajeId_userId_key" ON "MensajeVisto"("mensajeId", "userId");
CREATE INDEX "MensajeVisto_mensajeId_idx" ON "MensajeVisto"("mensajeId");
CREATE INDEX "MensajeVisto_userId_idx" ON "MensajeVisto"("userId");

ALTER TABLE "MensajeVisto" ADD CONSTRAINT "MensajeVisto_mensajeId_fkey"
  FOREIGN KEY ("mensajeId") REFERENCES "Mensaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MensajeVisto" ADD CONSTRAINT "MensajeVisto_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
