import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { registrarActividad } from "@/lib/actividad";

// GET /api/tarifas/[id] — descarga el archivo (solo administradores)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const documento = await prisma.documentoTarifa.findUnique({ where: { id } });
    if (!documento) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    return new NextResponse(documento.datos, {
      headers: {
        "Content-Type": documento.tipoArchivo,
        "Content-Disposition": `inline; filename="${encodeURIComponent(documento.nombreArchivo)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/tarifas/[id] — elimina un documento de tarifa (solo administradores)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const documento = await prisma.documentoTarifa.delete({ where: { id } });

    await registrarActividad({
      tipo: "DOCUMENTO_ELIMINADO",
      descripcion: `${admin.nombre} eliminó la tarifa de ${documento.comercial} (${documento.mes}/${documento.anio})`,
      usuarioId: admin.userId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
