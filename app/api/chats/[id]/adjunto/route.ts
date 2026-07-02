import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

// POST /api/chats/[id]/adjunto — envía un archivo adjunto en un chat
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    // Verificar que el usuario es participante
    const participante = await prisma.chatParticipante.findUnique({
      where: { chatId_userId: { chatId: id, userId: user.userId } },
    });
    if (!participante) {
      return NextResponse.json({ error: "No tienes acceso a este chat" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const texto = (formData.get("texto") as string)?.trim() || null;

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
    const adjuntoDatos: Uint8Array<ArrayBuffer> = new Uint8Array(arrayBuffer);

    const mensaje = await prisma.mensaje.create({
      data: {
        chatId: id,
        texto: texto ?? null,
        adjuntoNombre: file.name,
        adjuntoTipo: file.type || "application/octet-stream",
        adjuntoDatos,
        autorId: user.userId,
      },
      include: {
        autor: { select: { id: true, nombre: true } },
        vistos: { select: { userId: true } },
      },
    });

    return NextResponse.json({
      mensaje: {
        ...mensaje,
        adjuntoDatos: undefined, // no enviamos los bytes al cliente
        vistosPor: mensaje.vistos.map((v: { userId: string }) => v.userId),
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
