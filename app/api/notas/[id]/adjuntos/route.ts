import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

// POST /api/notas/[id]/adjuntos — sube un adjunto a una nota
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    // Verificar que el usuario es autor o tiene la nota compartida
    const nota = await prisma.nota.findUnique({
      where: { id },
      include: { compartidaCon: { select: { userId: true } } },
    });
    if (!nota) return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });

    const tieneAcceso =
      nota.autorId === user.userId ||
      nota.compartidaCon.some((c: { userId: string }) => c.userId === user.userId);
    if (!tieneAcceso) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No se ha enviado ningún archivo" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo supera el tamaño máximo (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const datos: Uint8Array<ArrayBuffer> = new Uint8Array(arrayBuffer);

    const adjunto = await prisma.notaAdjunto.create({
      data: {
        notaId: id,
        nombreArchivo: file.name,
        tipoArchivo: file.type || "application/octet-stream",
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
