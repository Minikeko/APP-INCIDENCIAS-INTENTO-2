import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { registrarActividad } from "@/lib/actividad";

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

// GET /api/tarifas — lista documentos de tarifas (solo administradores)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const anio = searchParams.get("anio");
    const comercial = searchParams.get("comercial");

    const documentos = await prisma.documentoTarifa.findMany({
      where: {
        ...(anio && { anio: Number(anio) }),
        ...(comercial && {
          comercial: { equals: comercial, mode: "insensitive" },
        }),
      },
      orderBy: [{ anio: "desc" }, { mes: "desc" }],
      include: { subidoPor: { select: { nombre: true } } },
    });

    return NextResponse.json({ documentos });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tarifas — sube un nuevo documento de tarifa (solo administradores)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mes = Number(formData.get("mes"));
    const anio = Number(formData.get("anio"));
    const comercial = (formData.get("comercial") as string)?.trim();

    if (!file) {
      return NextResponse.json({ error: "No se ha enviado ningún archivo" }, { status: 400 });
    }
    if (!mes || mes < 1 || mes > 12) {
      return NextResponse.json({ error: "El mes no es válido" }, { status: 400 });
    }
    if (!anio || anio < 2000) {
      return NextResponse.json({ error: "El año no es válido" }, { status: 400 });
    }
    if (!comercial) {
      return NextResponse.json({ error: "El comercial es obligatorio" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo supera el tamaño máximo permitido (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Usa imágenes, PDF, Word o Excel." },
        { status: 400 }
      );
    }

    const datos = new Uint8Array(await file.arrayBuffer());

    const documento = await prisma.documentoTarifa.create({
      data: {
        nombreArchivo: file.name,
        tipoArchivo: file.type,
        tamano: file.size,
        datos,
        mes,
        anio,
        comercial,
        subidoPorId: admin.userId,
      },
      select: {
        id: true,
        nombreArchivo: true,
        tipoArchivo: true,
        tamano: true,
        mes: true,
        anio: true,
        comercial: true,
        createdAt: true,
      },
    });

    await registrarActividad({
      tipo: "DOCUMENTO_SUBIDO",
      descripcion: `${admin.nombre} subió la tarifa de ${comercial} (${mes}/${anio})`,
      usuarioId: admin.userId,
      entidadId: documento.id,
    });

    return NextResponse.json({ documento }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
