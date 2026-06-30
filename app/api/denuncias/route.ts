import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { registrarActividad } from "@/lib/actividad";

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf"];

// GET /api/denuncias — lista denuncias (solo administradores)
export async function GET() {
  try {
    await requireAdmin();

    const denuncias = await prisma.denuncia.findMany({
      orderBy: { fecha: "desc" },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        fecha: true,
        archivoOriginalNombre: true,
        createdAt: true,
        creadoPor: { select: { nombre: true } },
        envios: {
          select: {
            envio: { select: { id: true, numeroSeguimiento: true, mensajero: true } },
          },
        },
      },
    });

    return NextResponse.json({ denuncias });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/denuncias — crea una denuncia (formulario o PDF subido) (solo administradores)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const formData = await req.formData();
    const titulo = (formData.get("titulo") as string)?.trim();
    const descripcion = (formData.get("descripcion") as string)?.trim() || null;
    const fechaRaw = formData.get("fecha") as string | null;
    const enviosIdsRaw = formData.get("enviosIds") as string | null;
    const file = formData.get("file") as File | null;

    if (!titulo) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    let archivoOriginalNombre: string | null = null;
    let archivoOriginalTipo: string | null = null;
    let archivoOriginalDatos: Buffer | null = null;

    if (file && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `El archivo supera el tamaño máximo permitido (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)` },
          { status: 400 }
        );
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Solo se permiten archivos PDF para la denuncia ya redactada" },
          { status: 400 }
        );
      }
      archivoOriginalNombre = file.name;
      archivoOriginalTipo = file.type;
      archivoOriginalDatos = Buffer.from(await file.arrayBuffer());
    }

    const enviosIds: string[] = enviosIdsRaw ? JSON.parse(enviosIdsRaw) : [];

    const denuncia = await prisma.denuncia.create({
      data: {
        titulo,
        descripcion,
        fecha: fechaRaw ? new Date(fechaRaw) : new Date(),
        archivoOriginalNombre,
        archivoOriginalTipo,
        archivoOriginalDatos,
        creadoPorId: admin.userId,
        envios: {
          create: enviosIds.map((envioId) => ({ envioId })),
        },
      },
      select: {
        id: true,
        titulo: true,
        fecha: true,
        createdAt: true,
      },
    });

    await registrarActividad({
      tipo: "DENUNCIA_CREADA",
      descripcion: `${admin.nombre} registró la denuncia "${denuncia.titulo}"`,
      usuarioId: admin.userId,
      entidadId: denuncia.id,
    });

    return NextResponse.json({ denuncia }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
