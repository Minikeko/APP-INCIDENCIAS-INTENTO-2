import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// GET /api/admin/chats/[id] — ve los mensajes de cualquier chat sin necesidad
// de ser participante (solo administradores; acceso de supervisión)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        participantes: { include: { user: { select: { id: true, nombre: true } } } },
        mensajes: {
          orderBy: { createdAt: "asc" },
          include: { autor: { select: { id: true, nombre: true } } },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    return handleApiError(error);
  }
}
