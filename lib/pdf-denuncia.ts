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

interface DatosDenuncia {
  titulo: string;
  descripcion: string | null;
  fecha: Date;
  creadoPor: string;
  envios: { numeroSeguimiento: string; mensajero: string }[];
}

/**
 * Genera un PDF con membrete corporativo (logo + nombre de empresa) a partir
 * del contenido escrito en la app para una denuncia. Devuelve los bytes del
 * PDF listos para servir o descargar.
 */
export async function generarPdfDenuncia(datos: DatosDenuncia): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = height - margin;

  // Membrete: logo + nombre de empresa
  try {
    const logoBytes = await getLogoBytes();
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoWidth = 70;
    const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
    page.drawImage(logoImage, {
      x: margin,
      y: y - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
    page.drawText(EMPRESA_NOMBRE, {
      x: margin + logoWidth + 15,
      y: y - logoHeight / 2 - 5,
      size: 13,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= logoHeight + 25;
  } catch {
    // Si el logo no se puede cargar, seguimos sin membrete gráfico para no
    // bloquear la generación del documento.
    page.drawText(EMPRESA_NOMBRE, {
      x: margin,
      y,
      size: 13,
      font: fontBold,
    });
    y -= 30;
  }

  // Línea separadora
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 30;

  // Título del documento
  page.drawText("DENUNCIA", {
    x: margin,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 28;

  page.drawText(datos.titulo, {
    x: margin,
    y,
    size: 13,
    font: fontBold,
  });
  y -= 22;

  // Metadatos: fecha y autor
  const fechaTexto = datos.fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  page.drawText(`Fecha: ${fechaTexto}`, {
    x: margin,
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 14;
  page.drawText(`Registrado por: ${datos.creadoPor}`, {
    x: margin,
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 25;

  // Descripción (con ajuste de línea simple por ancho de página)
  if (datos.descripcion) {
    const maxWidth = width - margin * 2;
    const fontSize = 11;
    const lineHeight = 15;
    const palabras = datos.descripcion.split(/\s+/);
    let lineaActual = "";

    for (const palabra of palabras) {
      const lineaPrueba = lineaActual ? `${lineaActual} ${palabra}` : palabra;
      const anchoLinea = fontRegular.widthOfTextAtSize(lineaPrueba, fontSize);
      if (anchoLinea > maxWidth && lineaActual) {
        if (y < margin + 60) {
          // Si nos quedamos sin espacio, no seguimos escribiendo fuera de la página
          break;
        }
        page.drawText(lineaActual, { x: margin, y, size: fontSize, font: fontRegular });
        y -= lineHeight;
        lineaActual = palabra;
      } else {
        lineaActual = lineaPrueba;
      }
    }
    if (lineaActual && y >= margin + 40) {
      page.drawText(lineaActual, { x: margin, y, size: fontSize, font: fontRegular });
      y -= lineHeight;
    }
    y -= 15;
  }

  // Envíos relacionados, si los hay
  if (datos.envios.length > 0 && y > margin + 60) {
    page.drawText("Envíos relacionados:", {
      x: margin,
      y,
      size: 11,
      font: fontBold,
    });
    y -= 18;
    for (const envio of datos.envios) {
      if (y < margin + 30) break;
      page.drawText(`• ${envio.numeroSeguimiento} — ${envio.mensajero}`, {
        x: margin + 10,
        y,
        size: 10,
        font: fontRegular,
      });
      y -= 15;
    }
  }

  // Pie de página
  page.drawText(`${EMPRESA_NOMBRE} — Documento generado automáticamente`, {
    x: margin,
    y: 30,
    size: 8,
    font: fontRegular,
    color: rgb(0.6, 0.6, 0.6),
  });

  return pdfDoc.save();
}
