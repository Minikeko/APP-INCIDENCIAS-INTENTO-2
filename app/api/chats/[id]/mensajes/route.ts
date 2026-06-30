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

// GET /api/chats/[id]/mensajes — lista los mensajes de un chat (solo participantes)
// Soporta polling incremental con ?despues=<ISO date> para traer solo mensajes nuevos
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
      include: { autor: { select: { id: true, nombre: true } } },
    });

    return NextResponse.json({ mensajes });
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
      include: { autor: { select: { id: true, nombre: true } } },
    });

    return NextResponse.json({ mensaje }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
