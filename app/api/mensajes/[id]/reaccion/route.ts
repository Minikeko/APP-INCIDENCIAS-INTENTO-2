import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// POST /api/mensajes/[id]/reaccion — añade o quita una reacción (toggle)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { emoji } = await req.json();

    if (!emoji) {
      return NextResponse.json({ error: "Emoji requerido" }, { status: 400 });
    }

    const existente = await prisma.reaccion.findUnique({
      where: { mensajeId_userId_emoji: { mensajeId: id, userId: user.userId, emoji } },
    });

    if (existente) {
      await prisma.reaccion.delete({ where: { id: existente.id } });
    } else {
      await prisma.reaccion.create({
        data: { mensajeId: id, userId: user.userId, emoji },
      });
    }

    const reacciones = await prisma.reaccion.findMany({
      where: { mensajeId: id },
      select: { emoji: true, userId: true },
    });

    return NextResponse.json({ reacciones });
  } catch (error) {
    return handleApiError(error);
  }
}
