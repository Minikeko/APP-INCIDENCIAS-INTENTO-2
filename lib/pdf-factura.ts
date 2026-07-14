import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";

const EMPRESA_NOMBRE = "GRUPO JAISER 2016 SLU";
let logoBytesCache: Buffer | null = null;

async function getLogoBytes(): Promise<Buffer> {
  if (logoBytesCache) return logoBytesCache;
  const logoPath = path.join(process.cwd(), "public", "logo-jaiser.png");
  logoBytesCache = await readFile(logoPath);
  return logoBytesCache;
}

function formatEur(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export interface LineaPDF {
  descripcion: string;
  cantidad: number;
  precioUnit: number;
  total: number;
}

export interface DatosFacturaPDF {
  numeroFactura: string;
  fechaEmision: Date;
  fechaVencimiento?: Date | null;
  clienteNombre: string;
  clienteNif?: string | null;
  clienteDireccion?: string | null;
  clienteEmail?: string | null;
  albaranes?: string | null;
  observaciones?: string | null;
  lineas: LineaPDF[];
  baseImponible: number;
  tipoIva: number;
  totalIva: number;
  total: number;
}

export async function generarPdfFactura(datos: DatosFacturaPDF): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const margin = 50;
  let y = height - margin;

  // --- Membrete ---
  try {
    const logoBytes = await getLogoBytes();
    const logoImg = await pdfDoc.embedPng(logoBytes);
    const lw = 70, lh = (logoImg.height / logoImg.width) * 70;
    page.drawImage(logoImg, { x: margin, y: y - lh, width: lw, height: lh });
    page.drawText(EMPRESA_NOMBRE, { x: margin + lw + 14, y: y - lh / 2 - 5, size: 13, font: bold, color: rgb(0.1, 0.1, 0.1) });
    y -= lh + 20;
  } catch {
    page.drawText(EMPRESA_NOMBRE, { x: margin, y, size: 13, font: bold });
    y -= 25;
  }

  // Línea separadora
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= 20;

  // --- Título FACTURA + número ---
  page.drawText("FACTURA", { x: margin, y, size: 20, font: bold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(datos.numeroFactura, { x: width - margin - 150, y, size: 14, font: bold, color: rgb(0.3, 0.3, 0.3) });
  y -= 22;

  // Fechas
  const fmtDate = (d: Date) => d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  page.drawText(`Fecha de emisión: ${fmtDate(datos.fechaEmision)}`, { x: margin, y, size: 10, font: regular, color: rgb(0.4, 0.4, 0.4) });
  if (datos.fechaVencimiento) {
    page.drawText(`Vencimiento: ${fmtDate(datos.fechaVencimiento)}`, { x: 320, y, size: 10, font: regular, color: rgb(0.4, 0.4, 0.4) });
  }
  y -= 20;

  // Albaranes
  if (datos.albaranes) {
    page.drawText(`Nº Albaranes: ${datos.albaranes}`, { x: margin, y, size: 10, font: regular, color: rgb(0.4, 0.4, 0.4) });
    y -= 18;
  }

  y -= 8;

  // --- Datos cliente ---
  page.drawRectangle({ x: margin, y: y - 70, width: width - margin * 2, height: 75, color: rgb(0.96, 0.96, 0.96), borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.5 });
  y -= 12;
  page.drawText("CLIENTE", { x: margin + 8, y, size: 9, font: bold, color: rgb(0.5, 0.5, 0.5) });
  y -= 15;
  page.drawText(datos.clienteNombre, { x: margin + 8, y, size: 11, font: bold });
  y -= 14;
  if (datos.clienteNif) { page.drawText(`NIF/CIF: ${datos.clienteNif}`, { x: margin + 8, y, size: 10, font: regular, color: rgb(0.3, 0.3, 0.3) }); y -= 13; }
  if (datos.clienteDireccion) { page.drawText(datos.clienteDireccion, { x: margin + 8, y, size: 10, font: regular, color: rgb(0.3, 0.3, 0.3) }); y -= 13; }
  if (datos.clienteEmail) { page.drawText(datos.clienteEmail, { x: margin + 8, y, size: 10, font: regular, color: rgb(0.3, 0.3, 0.3) }); }
  y -= 22;

  // --- Tabla de líneas ---
  const colX = { desc: margin, cant: 340, precio: 410, total: 490 };
  const rowH = 18;

  // Cabecera tabla
  page.drawRectangle({ x: margin, y: y - rowH + 4, width: width - margin * 2, height: rowH, color: rgb(0.2, 0.2, 0.2) });
  page.drawText("Descripción", { x: colX.desc + 4, y: y - 11, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Cant.", { x: colX.cant, y: y - 11, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Precio unit.", { x: colX.precio, y: y - 11, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Total", { x: colX.total, y: y - 11, size: 9, font: bold, color: rgb(1, 1, 1) });
  y -= rowH + 2;

  // Filas de líneas
  for (let i = 0; i < datos.lineas.length; i++) {
    const linea = datos.lineas[i];
    if (y < margin + 100) break;
    const bg = i % 2 === 0 ? rgb(1, 1, 1) : rgb(0.97, 0.97, 0.97);
    page.drawRectangle({ x: margin, y: y - rowH + 4, width: width - margin * 2, height: rowH, color: bg });
    // Truncar descripción si es muy larga
    const desc = linea.descripcion.length > 45 ? linea.descripcion.slice(0, 45) + "…" : linea.descripcion;
    page.drawText(desc, { x: colX.desc + 4, y: y - 11, size: 9, font: regular });
    page.drawText(String(linea.cantidad), { x: colX.cant, y: y - 11, size: 9, font: regular });
    page.drawText(formatEur(linea.precioUnit), { x: colX.precio, y: y - 11, size: 9, font: regular });
    page.drawText(formatEur(linea.total), { x: colX.total, y: y - 11, size: 9, font: regular });
    y -= rowH;
  }

  y -= 10;

  // --- Totales ---
  const totX = 380;
  page.drawLine({ start: { x: totX, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 14;
  page.drawText("Base imponible:", { x: totX, y, size: 10, font: regular, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(formatEur(datos.baseImponible), { x: width - margin - 60, y, size: 10, font: regular });
  y -= 14;
  page.drawText(`IVA (${datos.tipoIva}%):`, { x: totX, y, size: 10, font: regular, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(formatEur(datos.totalIva), { x: width - margin - 60, y, size: 10, font: regular });
  y -= 5;
  page.drawLine({ start: { x: totX, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.3, 0.3, 0.3) });
  y -= 18;
  page.drawText("TOTAL:", { x: totX, y, size: 13, font: bold });
  page.drawText(formatEur(datos.total), { x: width - margin - 80, y, size: 13, font: bold, color: rgb(0.1, 0.1, 0.1) });

  // Observaciones
  if (datos.observaciones && y > margin + 60) {
    y -= 30;
    page.drawText("Observaciones:", { x: margin, y, size: 9, font: bold, color: rgb(0.4, 0.4, 0.4) });
    y -= 13;
    const obs = datos.observaciones.slice(0, 200);
    page.drawText(obs, { x: margin, y, size: 9, font: regular, color: rgb(0.4, 0.4, 0.4), maxWidth: width - margin * 2 });
  }

  // Pie
  page.drawText(`${EMPRESA_NOMBRE} — Documento generado automáticamente`, { x: margin, y: 28, size: 8, font: regular, color: rgb(0.6, 0.6, 0.6) });

  const bytes = await pdfDoc.save();
  return new Uint8Array(bytes);
}
