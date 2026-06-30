import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import ExcelJS from "exceljs";

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
const MAX_FILAS_MUESTRA = 5;
const MAX_FILAS_TOTAL = 2000; // límite de seguridad para evitar importaciones descontroladas

// POST /api/gastos/analizar-excel — lee un Excel y devuelve sus cabeceras y
// unas filas de muestra, sin guardar nada todavía. Permite al usuario
// emparejar columnas antes de confirmar la importación masiva.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se ha enviado ningún archivo" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo supera el tamaño máximo permitido (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = new ExcelJS.Workbook();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workbook.xlsx.load(buffer as any);
    } catch {
      return NextResponse.json(
        { error: "No se ha podido leer el archivo. Comprueba que es un Excel válido (.xlsx)" },
        { status: 400 }
      );
    }

    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2) {
      return NextResponse.json(
        { error: "El Excel no tiene datos o le falta la fila de cabeceras" },
        { status: 400 }
      );
    }

    // Primera fila = cabeceras
    const cabeceras: string[] = [];
    sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cabeceras[colNumber - 1] = cell.value ? String(cell.value).trim() : `Columna ${colNumber}`;
    });

    const totalFilas = sheet.rowCount - 1; // sin contar la cabecera
    if (totalFilas > MAX_FILAS_TOTAL) {
      return NextResponse.json(
        { error: `El Excel tiene demasiadas filas (máximo ${MAX_FILAS_TOTAL})` },
        { status: 400 }
      );
    }

    const filasMuestra: string[][] = [];
    for (let i = 2; i <= Math.min(sheet.rowCount, MAX_FILAS_MUESTRA + 1); i++) {
      const fila: string[] = [];
      sheet.getRow(i).eachCell({ includeEmpty: true }, (cell, colNumber) => {
        fila[colNumber - 1] = cell.value !== null && cell.value !== undefined ? String(cell.value) : "";
      });
      filasMuestra.push(fila);
    }

    return NextResponse.json({
      cabeceras,
      filasMuestra,
      totalFilas,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
