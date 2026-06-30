import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import ExcelJS from "exceljs";

const MAX_FILAS_PREVIEW = 100;
const MAX_COLUMNAS_PREVIEW = 30;
const ANCHO_COLUMNA_DEFECTO = 64; // px aproximados si el Excel no especifica anchura

interface CeldaPreview {
  valor: string;
  negrita: boolean;
  cursiva: boolean;
  colorTexto: string | null; // hex CSS, p.ej. "#RRGGBB"
  colorFondo: string | null;
  alineacion: "left" | "center" | "right" | null;
}

// Convierte un color ARGB de Excel (formato "FFRRGGBB") a hex CSS "#RRGGBB".
// Ignora el canal alfa porque las hojas de cálculo casi siempre lo usan a FF.
function argbAHex(argb: string | undefined): string | null {
  if (!argb || argb.length < 6) return null;
  const rgb = argb.slice(-6);
  return `#${rgb}`;
}

// GET /api/gastos/[id]/preview — devuelve el Excel como una matriz de celdas
// con su formato (color, negrita, alineación) y los anchos de columna, para
// poder reconstruir una vista previa fiel al original en el navegador.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const gasto = await prisma.gasto.findUnique({ where: { id } });
    if (!gasto) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
    }

    const esExcel =
      gasto.tipoArchivo === "application/vnd.ms-excel" ||
      gasto.tipoArchivo ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (!esExcel) {
      return NextResponse.json(
        { error: "Este gasto no tiene un archivo Excel" },
        { status: 400 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(Buffer.from(gasto.datos) as any);
    const sheet = workbook.worksheets[0];

    if (!sheet) {
      return NextResponse.json({ filas: [], anchosColumnas: [] });
    }

    const numColumnas = Math.min(sheet.columnCount, MAX_COLUMNAS_PREVIEW);
    const limiteFilas = Math.min(sheet.rowCount, MAX_FILAS_PREVIEW);

    const anchosColumnas: number[] = [];
    for (let c = 1; c <= numColumnas; c++) {
      const col = sheet.getColumn(c);
      // El ancho de ExcelJS es en "unidades de carácter"; lo convertimos a px
      // con un factor aproximado estándar de Excel/Office.
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
