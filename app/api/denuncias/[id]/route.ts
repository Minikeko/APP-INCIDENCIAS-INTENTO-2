import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { registrarActividad } from "@/lib/actividad";

// GET /api/denuncias/[id] — detalle de una denuncia (solo administradores)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const denuncia = await prisma.denuncia.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        fecha: true,
        archivoOriginalNombre: true,
        createdAt: true,
        creadoPor: { select: { nombre: true } },
        envios: {
          select: {
            envio: { select: { id: true, numeroSeguimiento: true, mensajero: true } },
          },
        },
      },
    });

    if (!denuncia) {
      return NextResponse.json({ error: "Denuncia no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ denuncia });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/denuncias/[id] — elimina una denuncia (solo administradores)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const denuncia = await prisma.denuncia.delete({ where: { id } });

    await registrarActividad({
      tipo: "DENUNCIA_ELIMINADA",
      descripcion: `${admin.nombre} eliminó la denuncia "${denuncia.titulo}"`,
      usuarioId: admin.userId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
