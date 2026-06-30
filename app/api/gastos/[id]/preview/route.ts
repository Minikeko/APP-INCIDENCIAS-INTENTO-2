import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import ExcelJS from "exceljs";

const MAX_FILAS_PREVIEW = 50;

// GET /api/gastos/[id]/preview — devuelve las primeras filas de un gasto en
// Excel como tabla JSON (los navegadores no pueden renderizar .xlsx en un
// iframe, así que generamos una vista de tabla en su lugar)
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
      return NextResponse.json({ filas: [] });
    }

    const filas: string[][] = [];
    const limite = Math.min(sheet.rowCount, MAX_FILAS_PREVIEW);
    for (let i = 1; i <= limite; i++) {
      const fila: string[] = [];
      sheet.getRow(i).eachCell({ includeEmpty: true }, (cell, colNumber) => {
        fila[colNumber - 1] = cell.value !== null && cell.value !== undefined ? String(cell.value) : "";
      });
      filas.push(fila);
    }

    return NextResponse.json({ filas, totalFilas: sheet.rowCount });
  } catch (error) {
    return handleApiError(error);
  }
}
