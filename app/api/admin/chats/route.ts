import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// GET /api/admin/chats — lista TODOS los chats existentes, con sus participantes
// (solo administradores; acceso de supervisión)
export async function GET() {
  try {
    await requireAdmin();

    const chats = await prisma.chat.findMany({
      include: {
        participantes: { include: { user: { select: { id: true, nombre: true } } } },
        mensajes: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { mensajes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const chatsOrdenados = chats
      .map((chat: (typeof chats)[number]) => ({
        ...chat,
        ultimaActividad: chat.mensajes[0]?.createdAt || chat.createdAt,
      }))
      .sort(
        (a: { ultimaActividad: Date }, b: { ultimaActividad: Date }) =>
          new Date(b.ultimaActividad).getTime() - new Date(a.ultimaActividad).getTime()
      );

    return NextResponse.json({ chats: chatsOrdenados });
  } catch (error) {
    return handleApiError(error);
  }
}
