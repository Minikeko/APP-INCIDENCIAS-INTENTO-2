import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { titulo, contenido, color } = await req.json() as {
      titulo?: string; contenido?: string; color?: string;
    };

    const nota = await prisma.nota.findUnique({ where: { id } });
    if (!nota) return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
    if (nota.autorId !== user.userId) {
      return NextResponse.json({ error: "Solo el autor puede editar la nota" }, { status: 403 });
    }

    const actualizada = await prisma.nota.update({
      where: { id },
      data: {
        titulo: titulo ?? nota.titulo,
        contenido: contenido ?? nota.contenido,
        color: color ?? nota.color,
      },
      include: {
        compartidaCon: { include: { user: { select: { id: true, nombre: true } } } },
      },
    });

    return NextResponse.json({ nota: actualizada });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const nota = await prisma.nota.findUnique({ where: { id } });
    if (!nota) return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
    if (nota.autorId !== user.userId) {
      return NextResponse.json({ error: "Solo el autor puede eliminar la nota" }, { status: 403 });
    }

    await prisma.nota.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
