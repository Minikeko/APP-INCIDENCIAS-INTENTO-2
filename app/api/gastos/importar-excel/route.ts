import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { registrarActividad } from "@/lib/actividad";
import { detectarCategoriaGasto, CATEGORIAS_GASTO } from "@/lib/constants";
import ExcelJS from "exceljs";

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
const MAX_FILAS_TOTAL = 2000;

function parsearFecha(valor: unknown): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  const texto = String(valor).trim();
  const match = texto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (match) {
    const [, d, m, y] = match;
    const anio = y.length === 2 ? Number(`20${y}`) : Number(y);
    const fecha = new Date(anio, Number(m) - 1, Number(d));
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }
  const fecha = new Date(texto);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function parsearImporte(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "number") return valor;
  const texto = String(valor).trim().replace(/[€\s]/g, "");
  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;
  const numero = Number(normalizado);
  return Number.isNaN(numero) ? null : numero;
}

// POST /api/gastos/importar-excel — importa varias filas de un Excel como
// gastos nuevos, según el mapeo de columnas indicado (solo administradores)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mapeoRaw = formData.get("mapeo") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No se ha enviado ningún archivo" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo supera el tamaño máximo permitido (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }
    if (!mapeoRaw) {
      return NextResponse.json({ error: "Falta el mapeo de columnas" }, { status: 400 });
    }

    const mapeo: {
      columnaFecha: number;
      columnaImporte: number;
      columnaCategoria: number | null;
      columnaDescripcion: number | null;
    } = JSON.parse(mapeoRaw);

    if (!mapeo.columnaFecha || !mapeo.columnaImporte) {
      return NextResponse.json(
        { error: "Debes indicar al menos las columnas de fecha e importe" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.worksheets[0];

    if (!sheet || sheet.rowCount < 2) {
      return NextResponse.json({ error: "El Excel no tiene filas de datos" }, { status: 400 });
    }

    const totalFilas = sheet.rowCount - 1;
    if (totalFilas > MAX_FILAS_TOTAL) {
      return NextResponse.json(
        { error: `El Excel tiene demasiadas filas (máximo ${MAX_FILAS_TOTAL})` },
        { status: 400 }
      );
    }

    const gastosCrear: {
      fecha: Date;
      importe: number;
      categoria: keyof typeof CATEGORIAS_GASTO;
      descripcion: string | null;
    }[] = [];
    const filasConError: number[] = [];

    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      const valorFecha = row.getCell(mapeo.columnaFecha).value;
      const valorImporte = row.getCell(mapeo.columnaImporte).value;

      if (!valorFecha && !valorImporte) continue;

      const fecha = parsearFecha(valorFecha);
      const importe = parsearImporte(valorImporte);

      if (!fecha || importe === null) {
        filasConError.push(i);
        continue;
      }

      const textoCategoria = mapeo.columnaCategoria
        ? String(row.getCell(mapeo.columnaCategoria).value ?? "")
        : "";
      const descripcion = mapeo.columnaDescripcion
        ? String(row.getCell(mapeo.columnaDescripcion).value ?? "").trim() || null
        : null;

      gastosCrear.push({
        fecha,
        importe,
        categoria: textoCategoria ? detectarCategoriaGasto(textoCategoria) : "OTROS",
        descripcion,
      });
    }

    if (gastosCrear.length === 0) {
      return NextResponse.json(
        { error: "No se ha podido importar ninguna fila válida del Excel" },
        { status: 400 }
      );
    }

    const excelBytes: Uint8Array<ArrayBuffer> = new Uint8Array(arrayBuffer);

    const resultado = await prisma.$transaction(
      gastosCrear.map((g) =>
        prisma.gasto.create({
          data: {
            nombreArchivo: file.name,
            tipoArchivo:
              file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            tamano: file.size,
            datos: excelBytes,
            fecha: g.fecha,
            importe: g.importe,
            categoria: g.categoria,
            descripcion: g.descripcion,
            subidoPorId: admin.userId,
          },
        })
      )
    );

    await registrarActividad({
      tipo: "GASTO_SUBIDO",
      descripcion: `${admin.nombre} importó ${resultado.length} gasto(s) desde un Excel (${file.name})`,
      usuarioId: admin.userId,
    });

    return NextResponse.json({
      importados: resultado.length,
      filasConError,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
