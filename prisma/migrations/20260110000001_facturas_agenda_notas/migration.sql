-- FacturaManual y LineaFactura
CREATE TABLE "FacturaManual" (
  "id"               TEXT NOT NULL,
  "numeroFactura"    TEXT NOT NULL,
  "fechaEmision"     TIMESTAMP(3) NOT NULL,
  "fechaVencimiento" TIMESTAMP(3),
  "clienteNombre"    TEXT NOT NULL,
  "clienteNif"       TEXT,
  "clienteDireccion" TEXT,
  "clienteEmail"     TEXT,
  "observaciones"    TEXT,
  "albaranes"        TEXT,
  "baseImponible"    DECIMAL(12,2) NOT NULL,
  "tipoIva"          INTEGER NOT NULL DEFAULT 21,
  "totalIva"         DECIMAL(12,2) NOT NULL,
  "total"            DECIMAL(12,2) NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "creadoPorId"      TEXT NOT NULL,
  CONSTRAINT "FacturaManual_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FacturaManual_fechaEmision_idx" ON "FacturaManual"("fechaEmision");
CREATE INDEX "FacturaManual_clienteNombre_idx" ON "FacturaManual"("clienteNombre");
ALTER TABLE "FacturaManual" ADD CONSTRAINT "FacturaManual_creadoPorId_fkey"
  FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "LineaFactura" (
  "id"          TEXT NOT NULL,
  "facturaId"   TEXT NOT NULL,
  "descripcion" TEXT NOT NULL,
  "cantidad"    DECIMAL(10,2) NOT NULL,
  "precioUnit"  DECIMAL(12,2) NOT NULL,
  "total"       DECIMAL(12,2) NOT NULL,
  "orden"       INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "LineaFactura_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "LineaFactura" ADD CONSTRAINT "LineaFactura_facturaId_fkey"
  FOREIGN KEY ("facturaId") REFERENCES "FacturaManual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EventoAgenda y EventoParticipante
CREATE TABLE "EventoAgenda" (
  "id"          TEXT NOT NULL,
  "titulo"      TEXT NOT NULL,
  "descripcion" TEXT,
  "fechaInicio" TIMESTAMP(3) NOT NULL,
  "fechaFin"    TIMESTAMP(3),
  "todoElDia"   BOOLEAN NOT NULL DEFAULT false,
  "color"       TEXT NOT NULL DEFAULT '#e8a33d',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "creadoPorId" TEXT NOT NULL,
  CONSTRAINT "EventoAgenda_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EventoAgenda_fechaInicio_idx" ON "EventoAgenda"("fechaInicio");
CREATE INDEX "EventoAgenda_creadoPorId_idx" ON "EventoAgenda"("creadoPorId");
ALTER TABLE "EventoAgenda" ADD CONSTRAINT "EventoAgenda_creadoPorId_fkey"
  FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "EventoParticipante" (
  "id"       TEXT NOT NULL,
  "eventoId" TEXT NOT NULL,
  "userId"   TEXT NOT NULL,
  CONSTRAINT "EventoParticipante_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EventoParticipante_eventoId_userId_key" ON "EventoParticipante"("eventoId", "userId");
CREATE INDEX "EventoParticipante_userId_idx" ON "EventoParticipante"("userId");
ALTER TABLE "EventoParticipante" ADD CONSTRAINT "EventoParticipante_eventoId_fkey"
  FOREIGN KEY ("eventoId") REFERENCES "EventoAgenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventoParticipante" ADD CONSTRAINT "EventoParticipante_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Nota y NotaCompartida
CREATE TABLE "Nota" (
  "id"        TEXT NOT NULL,
  "titulo"    TEXT NOT NULL,
  "contenido" TEXT NOT NULL,
  "color"     TEXT NOT NULL DEFAULT '#e8a33d',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "autorId"   TEXT NOT NULL,
  CONSTRAINT "Nota_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Nota_autorId_idx" ON "Nota"("autorId");
CREATE INDEX "Nota_createdAt_idx" ON "Nota"("createdAt");
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_autorId_fkey"
  FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "NotaCompartida" (
  "id"     TEXT NOT NULL,
  "notaId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "NotaCompartida_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotaCompartida_notaId_userId_key" ON "NotaCompartida"("notaId", "userId");
CREATE INDEX "NotaCompartida_userId_idx" ON "NotaCompartida"("userId");
ALTER TABLE "NotaCompartida" ADD CONSTRAINT "NotaCompartida_notaId_fkey"
  FOREIGN KEY ("notaId") REFERENCES "Nota"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotaCompartida" ADD CONSTRAINT "NotaCompartida_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
