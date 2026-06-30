import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { registrarActividad } from "@/lib/actividad";
import { CATEGORIAS_GASTO } from "@/lib/constants";

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

// GET /api/gastos — lista gastos con filtros opcionales (solo administradores)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get("categoria");
    const anio = searchParams.get("anio");

    const gastos = await prisma.gasto.findMany({
      where: {
        ...(categoria && { categoria: categoria as keyof typeof CATEGORIAS_GASTO }),
        ...(anio && {
          fecha: {
            gte: new Date(`${anio}-01-01`),
            lt: new Date(`${Number(anio) + 1}-01-01`),
          },
        }),
      },
      orderBy: { fecha: "desc" },
      select: {
        id: true,
        nombreArchivo: true,
        tipoArchivo: true,
        tamano: true,
        fecha: true,
        importe: true,
        categoria: true,
        descripcion: true,
        createdAt: true,
        subidoPor: { select: { nombre: true } },
      },
    });

    const gastosSerializados = gastos.map((g: (typeof gastos)[number]) => ({
      ...g,
      importe: Number(g.importe),
    }));

    return NextResponse.json({ gastos: gastosSerializados });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/gastos — sube un nuevo gasto (solo administradores)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fechaRaw = formData.get("fecha") as string | null;
    const importeRaw = formData.get("importe") as string | null;
    const categoria = formData.get("categoria") as string | null;
    const descripcion = (formData.get("descripcion") as string)?.trim() || null;

    if (!file) {
      return NextResponse.json({ error: "No se ha enviado ningún archivo" }, { status: 400 });
    }
    if (!fechaRaw) {
      return NextResponse.json({ error: "La fecha es obligatoria" }, { status: 400 });
    }
    if (!importeRaw || Number.isNaN(Number(importeRaw))) {
      return NextResponse.json({ error: "El importe no es válido" }, { status: 400 });
    }
    if (!categoria || !(categoria in CATEGORIAS_GASTO)) {
      return NextResponse.json({ error: "La categoría no es válida" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo supera el tamaño máximo permitido (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Solo se permiten archivos PDF o Excel para los gastos" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const datos: Uint8Array<ArrayBuffer> = new Uint8Array(arrayBuffer);

    const gasto = await prisma.gasto.create({
      data: {
        nombreArchivo: file.name,
        tipoArchivo: file.type,
        tamano: file.size,
        datos,
        fecha: new Date(fechaRaw),
        importe: Number(importeRaw),
        categoria: categoria as keyof typeof CATEGORIAS_GASTO,
        descripcion,
        subidoPorId: admin.userId,
      },
      select: {
        id: true,
        nombreArchivo: true,
        fecha: true,
        importe: true,
        categoria: true,
      },
    });

    await registrarActividad({
      tipo: "GASTO_SUBIDO",
      descripcion: `${admin.nombre} subió un gasto de ${CATEGORIAS_GASTO[gasto.categoria as keyof typeof CATEGORIAS_GASTO]} (${Number(gasto.importe).toFixed(2)} €)`,
      usuarioId: admin.userId,
      entidadId: gasto.id,
    });

    return NextResponse.json(
      { gasto: { ...gasto, importe: Number(gasto.importe) } },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
