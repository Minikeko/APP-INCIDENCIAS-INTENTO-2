import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// GET /api/mensajes/[id]/adjunto — descarga el adjunto de un mensaje
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const mensaje = await prisma.mensaje.findUnique({
      where: { id },
      include: {
        chat: {
          include: { participantes: { select: { userId: true } } },
        },
      },
    });

    if (!mensaje) {
      return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
    }

    // Verificar que el usuario es participante del chat
    const esParticipante = mensaje.chat.participantes.some(
      (p: { userId: string }) => p.userId === user.userId
    );
    if (!esParticipante) {
      return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    }

    if (!mensaje.adjuntoDatos || !mensaje.adjuntoNombre) {
      return NextResponse.json({ error: "Este mensaje no tiene adjunto" }, { status: 404 });
    }

    const bytes = new Uint8Array(mensaje.adjuntoDatos);

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": mensaje.adjuntoTipo || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(mensaje.adjuntoNombre)}"`,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
