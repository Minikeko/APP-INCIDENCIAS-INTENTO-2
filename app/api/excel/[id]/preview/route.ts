import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import ExcelJS from "exceljs";

const MAX_FILAS_PREVIEW = 100;
const MAX_COLUMNAS_PREVIEW = 30;
const ANCHO_COLUMNA_DEFECTO = 64;

interface CeldaPreview {
  valor: string;
  negrita: boolean;
  cursiva: boolean;
  colorTexto: string | null;
  colorFondo: string | null;
  alineacion: "left" | "center" | "right" | null;
}

function argbAHex(argb: string | undefined): string | null {
  if (!argb || argb.length < 6) return null;
  return `#${argb.slice(-6)}`;
}

// GET /api/excel/[id]/preview — vista previa con formato del Excel
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const archivo = await prisma.archivoExcel.findUnique({ where: { id } });
    if (!archivo) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(Buffer.from(archivo.datos) as any);
    const sheet = workbook.worksheets[0];

    if (!sheet) {
      return NextResponse.json({ filas: [], anchosColumnas: [] });
    }

    const numColumnas = Math.min(sheet.columnCount, MAX_COLUMNAS_PREVIEW);
    const limiteFilas = Math.min(sheet.rowCount, MAX_FILAS_PREVIEW);

    const anchosColumnas: number[] = [];
    for (let c = 1; c <= numColumnas; c++) {
      const col = sheet.getColumn(c);
      anchosColumnas.push(col.width ? Math.round(col.width * 7) : ANCHO_COLUMNA_DEFECTO);
    }

    const filas: CeldaPreview[][] = [];
    for (let r = 1; r <= limiteFilas; r++) {
      const row = sheet.getRow(r);
      const fila: CeldaPreview[] = [];
      for (let c = 1; c <= numColumnas; c++) {
        const cell = row.getCell(c);
        const fill = cell.style?.fill;
        const colorFondo =
          fill && fill.type === "pattern" && fill.pattern === "solid"
            ? argbAHex(fill.fgColor?.argb)
            : null;

        fila.push({
          valor:
            cell.value !== null && cell.value !== undefined
              ? cell.text ?? String(cell.value)
              : "",
          negrita: !!cell.style?.font?.bold,
          cursiva: !!cell.style?.font?.italic,
          colorTexto: argbAHex(cell.style?.font?.color?.argb),
          colorFondo,
          alineacion:
            cell.style?.alignment?.horizontal === "center" ||
            cell.style?.alignment?.horizontal === "right"
              ? cell.style.alignment.horizontal
              : null,
        });
      }
      filas.push(fila);
    }

    return NextResponse.json({
      filas,
      anchosColumnas,
      totalFilas: sheet.rowCount,
      totalColumnas: sheet.columnCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
