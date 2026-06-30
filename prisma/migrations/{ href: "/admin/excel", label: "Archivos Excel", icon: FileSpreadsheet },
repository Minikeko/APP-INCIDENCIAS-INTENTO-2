-- CreateTable: ArchivoExcel — sección para subir Excels sin campos obligatorios

CREATE TABLE "ArchivoExcel" (
  "id" TEXT NOT NULL,
  "nombreArchivo" TEXT NOT NULL,
  "tamano" INTEGER NOT NULL,
  "datos" BYTEA NOT NULL,
  "descripcion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "subidoPorId" TEXT NOT NULL,
  CONSTRAINT "ArchivoExcel_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ArchivoExcel_createdAt_idx" ON "ArchivoExcel"("createdAt");

ALTER TABLE "ArchivoExcel" ADD CONSTRAINT "ArchivoExcel_subidoPorId_fkey"
  FOREIGN KEY ("subidoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
