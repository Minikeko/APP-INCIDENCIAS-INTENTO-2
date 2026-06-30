import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { registrarActividad } from "@/lib/actividad";

// GET /api/envios/[id] — detalle completo de un envío
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;

    const envio = await prisma.envio.findUnique({
      where: { id },
      include: {
        creadoPor: { select: { nombre: true, email: true } },
        cambiosEstado: {
          orderBy: { createdAt: "desc" },
          include: { creadoPor: { select: { nombre: true } } },
        },
        comentarios: {
          orderBy: { createdAt: "desc" },
          include: { creadoPor: { select: { nombre: true } } },
        },
        adjuntos: {
          select: {
            id: true,
            nombreArchivo: true,
            tipoArchivo: true,
            tamano: true,
            createdAt: true,
          },
        },
      },
    });

    if (!envio) {
      return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ envio });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/envios/[id] — actualiza los datos de un envío (no el estado, ver /estado)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();

    const {
      mensajero,
      motivo,
      descripcion,
      destinatario,
      direccion,
      fechaEnvio,
    } = body;

    const envio = await prisma.envio.update({
      where: { id },
      data: {
        ...(mensajero !== undefined && { mensajero: mensajero.trim() }),
        ...(motivo !== undefined && { motivo: motivo?.trim() || null }),
        ...(descripcion !== undefined && {
          descripcion: descripcion?.trim() || null,
        }),
        ...(destinatario !== undefined && {
          destinatario: destinatario?.trim() || null,
        }),
        ...(direccion !== undefined && { direccion: direccion?.trim() || null }),
        ...(fechaEnvio !== undefined && {
          fechaEnvio: fechaEnvio ? new Date(fechaEnvio) : null,
        }),
      },
    });

    await registrarActividad({
      tipo: "ENVIO_EDITADO",
      descripcion: `${user.nombre} editó los datos del envío ${envio.numeroSeguimiento}`,
      usuarioId: user.userId,
      entidadId: envio.id,
    });

    return NextResponse.json({ envio });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/envios/[id] — elimina un envío (solo administradores)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const envio = await prisma.envio.delete({ where: { id } });

    await registrarActividad({
      tipo: "ENVIO_ELIMINADO",
      descripcion: `${admin.nombre} eliminó el envío ${envio.numeroSeguimiento}`,
      usuarioId: admin.userId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
