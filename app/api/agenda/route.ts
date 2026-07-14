import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { crearNotificaciones } from "@/lib/notificaciones";

// GET /api/agenda — eventos del mes visible + eventos propios y asignados
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const eventos = await prisma.eventoAgenda.findMany({
      where: {
        OR: [
          { creadoPorId: user.userId },
          { participantes: { some: { userId: user.userId } } },
        ],
        ...(desde && hasta
          ? { fechaInicio: { gte: new Date(desde), lte: new Date(hasta) } }
          : {}),
      },
      include: {
        creadoPor: { select: { id: true, nombre: true } },
        participantes: { include: { user: { select: { id: true, nombre: true } } } },
      },
      orderBy: { fechaInicio: "asc" },
    });

    return NextResponse.json({ eventos });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/agenda — crea un nuevo evento
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { titulo, descripcion, fechaInicio, fechaFin, todoElDia, color, participantesIds } = body as {
      titulo: string;
      descripcion?: string;
      fechaInicio: string;
      fechaFin?: string;
      todoElDia?: boolean;
      color?: string;
      participantesIds?: string[];
    };

    if (!titulo || !fechaInicio) {
      return NextResponse.json({ error: "Título y fecha de inicio son obligatorios" }, { status: 400 });
    }

    const idsUnicos = Array.from(new Set([...(participantesIds ?? [])])).filter(
      (id) => id !== user.userId
    );

    const evento = await prisma.eventoAgenda.create({
      data: {
        titulo,
        descripcion: descripcion || null,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        todoElDia: todoElDia ?? false,
        color: color || "#e8a33d",
        creadoPorId: user.userId,
        participantes: {
          create: idsUnicos.map((userId) => ({ userId })),
        },
      },
      include: {
        creadoPor: { select: { id: true, nombre: true } },
        participantes: { include: { user: { select: { id: true, nombre: true } } } },
      },
    });

    // Notificar a los participantes
    if (idsUnicos.length > 0) {
      const fecha = new Date(fechaInicio).toLocaleDateString("es-ES", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      });
      await crearNotificaciones({
        tipo: "EVENTO_RECORDATORIO",
        titulo: `${user.nombre} te ha añadido a un evento`,
        cuerpo: `${titulo} — ${fecha}`,
        url: "/agenda",
        usuarioIds: idsUnicos,
        excluyendo: user.userId,
      });
    }

    return NextResponse.json({ evento }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
