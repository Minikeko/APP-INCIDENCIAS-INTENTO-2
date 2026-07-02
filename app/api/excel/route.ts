import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

// GET /api/excel — lista todos los archivos Excel subidos (solo administradores)
export async function GET() {
  try {
    await requireAdmin();

    const archivos = await prisma.archivoExcel.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nombreArchivo: true,
        tamano: true,
        descripcion: true,
        createdAt: true,
        subidoPor: { select: { nombre: true } },
      },
    });

    return NextResponse.json({ archivos });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/excel — sube un archivo Excel (solo administradores)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const descripcion = (formData.get("descripcion") as string)?.trim() || null;

    if (!file) {
      return NextResponse.json({ error: "No se ha enviado ningún archivo" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo supera el tamaño máximo (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const datos: Uint8Array<ArrayBuffer> = new Uint8Array(arrayBuffer);

    const archivo = await prisma.archivoExcel.create({
      data: {
        nombreArchivo: file.name,
        tamano: file.size,
        datos,
        descripcion,
        subidoPorId: admin.userId,
      },
      select: {
        id: true,
        nombreArchivo: true,
        tamano: true,
        descripcion: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ archivo }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
