import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { registrarActividad } from "@/lib/actividad";

// GET /api/chats — lista los chats en los que participa el usuario actual
export async function GET() {
  try {
    const user = await requireUser();

    const chats = await prisma.chat.findMany({
      where: { participantes: { some: { userId: user.userId } } },
      include: {
        participantes: { include: { user: { select: { id: true, nombre: true } } } },
        mensajes: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { autor: { select: { nombre: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Ordenamos por el mensaje más reciente (o fecha de creación si no hay mensajes)
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

// POST /api/chats — crea un chat privado o grupal con los participantes indicados
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { participantesIds, nombre } = await req.json();

    if (!Array.isArray(participantesIds) || participantesIds.length === 0) {
      return NextResponse.json(
        { error: "Selecciona al menos un participante" },
        { status: 400 }
      );
    }

    // El creador siempre forma parte del chat, evitamos duplicados
    const idsUnicos = Array.from(new Set([user.userId, ...participantesIds]));
    const esGrupal = idsUnicos.length > 2;

    // Si es un chat privado (2 personas), reutilizamos uno existente si ya existe
    if (!esGrupal) {
      const otroUserId = idsUnicos.find((id) => id !== user.userId)!;
      const chatExistente = await prisma.chat.findFirst({
        where: {
          tipo: "PRIVADO",
          AND: [
            { participantes: { some: { userId: user.userId } } },
            { participantes: { some: { userId: otroUserId } } },
          ],
        },
        include: {
          participantes: { include: { user: { select: { id: true, nombre: true } } } },
        },
      });
      if (chatExistente) {
        return NextResponse.json({ chat: chatExistente });
      }
    }

    const chat = await prisma.chat.create({
      data: {
        tipo: esGrupal ? "GRUPAL" : "PRIVADO",
        nombre: esGrupal ? nombre?.trim() || null : null,
        participantes: {
          create: idsUnicos.map((userId) => ({ userId })),
        },
      },
      include: {
        participantes: { include: { user: { select: { id: true, nombre: true } } } },
      },
    });

    await registrarActividad({
      tipo: "CHAT_CREADO",
      descripcion: `${user.nombre} creó un chat ${esGrupal ? "grupal" : "privado"}`,
      usuarioId: user.userId,
      entidadId: chat.id,
    });

    return NextResponse.json({ chat }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
