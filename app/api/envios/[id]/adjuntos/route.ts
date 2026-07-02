import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

// POST /api/envios/[id]/adjuntos — sube un archivo adjunto al envío
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;

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

    const envio = await prisma.envio.findUnique({ where: { id } });
    if (!envio) {
      return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const datos: Uint8Array<ArrayBuffer> = new Uint8Array(arrayBuffer);

    const adjunto = await prisma.adjunto.create({
      data: {
        envioId: id,
        nombreArchivo: file.name,
        tipoArchivo: file.type,
        tamano: file.size,
        datos,
      },
      select: {
        id: true,
        nombreArchivo: true,
        tipoArchivo: true,
        tamano: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ adjunto }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
