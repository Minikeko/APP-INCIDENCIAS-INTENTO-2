import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// PATCH /api/mensajes/[id] — edita el texto de un mensaje (solo el autor)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { texto } = await req.json();

    if (!texto?.trim()) {
      return NextResponse.json({ error: "El texto no puede estar vacío" }, { status: 400 });
    }

    const mensaje = await prisma.mensaje.findUnique({ where: { id } });
    if (!mensaje) {
      return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
    }
    if (mensaje.autorId !== user.userId) {
      return NextResponse.json({ error: "Solo puedes editar tus propios mensajes" }, { status: 403 });
    }

    const actualizado = await prisma.mensaje.update({
      where: { id },
      data: { texto: texto.trim(), editado: true, editadoAt: new Date() },
      include: {
        autor: { select: { id: true, nombre: true } },
        vistos: { select: { userId: true } },
        reacciones: { select: { emoji: true, userId: true } },
      },
    });

    return NextResponse.json({ mensaje: { ...actualizado, vistosPor: actualizado.vistos.map((v: { userId: string }) => v.userId) } });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/mensajes/[id] — elimina un mensaje (solo el autor)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const mensaje = await prisma.mensaje.findUnique({ where: { id } });
    if (!mensaje) {
      return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
    }
    if (mensaje.autorId !== user.userId) {
      return NextResponse.json({ error: "Solo puedes eliminar tus propios mensajes" }, { status: 403 });
    }

    await prisma.mensaje.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
