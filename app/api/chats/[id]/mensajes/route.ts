import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

async function verificarParticipante(chatId: string, userId: string) {
  const participante = await prisma.chatParticipante.findUnique({
    where: { chatId_userId: { chatId, userId } },
  });
  return !!participante;
}

// GET /api/chats/[id]/mensajes — lista mensajes y marca los nuevos como vistos
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const esParticipante = await verificarParticipante(id, user.userId);
    if (!esParticipante) {
      return NextResponse.json({ error: "No tienes acceso a este chat" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const despues = searchParams.get("despues");

    const mensajes = await prisma.mensaje.findMany({
      where: {
        chatId: id,
        ...(despues && { createdAt: { gt: new Date(despues) } }),
      },
      orderBy: { createdAt: "asc" },
      include: {
        autor: { select: { id: true, nombre: true } },
        vistos: { select: { userId: true } },
      },
    });

    // Registrar como vistos los mensajes que no son del propio usuario
    // y que aún no ha marcado como vistos
    type MensajeConVistos = (typeof mensajes)[number];
    const mensajesAMarcar = mensajes.filter(
      (m: MensajeConVistos) => m.autorId !== user.userId && !m.vistos.some((v: (typeof m.vistos)[number]) => v.userId === user.userId)
    );

    if (mensajesAMarcar.length > 0) {
      await prisma.mensajeVisto.createMany({
        data: mensajesAMarcar.map((m: MensajeConVistos) => ({
          mensajeId: m.id,
          userId: user.userId,
        })),
        skipDuplicates: true,
      });
    }

    // Devolver mensajes con la lista de IDs de usuarios que los han visto
    const mensajesConVistos = mensajes.map((m: MensajeConVistos) => ({
      id: m.id,
      texto: m.texto,
      createdAt: m.createdAt,
      autor: m.autor,
      vistosPor: m.vistos.map((v: (typeof m.vistos)[number]) => v.userId),
    }));

    return NextResponse.json({ mensajes: mensajesConVistos });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/chats/[id]/mensajes — envía un mensaje (solo participantes)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const esParticipante = await verificarParticipante(id, user.userId);
    if (!esParticipante) {
      return NextResponse.json({ error: "No tienes acceso a este chat" }, { status: 403 });
    }

    const { texto } = await req.json();
    if (!texto?.trim()) {
      return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
    }

    const mensaje = await prisma.mensaje.create({
      data: {
        chatId: id,
        texto: texto.trim(),
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
        vistosPor: mensaje.vistos.map((v: { userId: string }) => v.userId),
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
