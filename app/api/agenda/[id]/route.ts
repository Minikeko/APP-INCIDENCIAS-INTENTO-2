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
    const body = await req.json();

    const evento = await prisma.eventoAgenda.findUnique({ where: { id } });
    if (!evento) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    if (evento.creadoPorId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    }

    const actualizado = await prisma.eventoAgenda.update({
      where: { id },
      data: {
        titulo: body.titulo ?? evento.titulo,
        descripcion: body.descripcion ?? evento.descripcion,
        fechaInicio: body.fechaInicio ? new Date(body.fechaInicio) : evento.fechaInicio,
        fechaFin: body.fechaFin ? new Date(body.fechaFin) : evento.fechaFin,
        todoElDia: body.todoElDia ?? evento.todoElDia,
        color: body.color ?? evento.color,
      },
      include: {
        creadoPor: { select: { id: true, nombre: true } },
        participantes: { include: { user: { select: { id: true, nombre: true } } } },
      },
    });

    return NextResponse.json({ evento: actualizado });
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

    const evento = await prisma.eventoAgenda.findUnique({ where: { id } });
    if (!evento) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    if (evento.creadoPorId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    }

    await prisma.eventoAgenda.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
