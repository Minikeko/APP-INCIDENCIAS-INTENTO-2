import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { registrarActividad } from "@/lib/actividad";
import { CATEGORIAS_GASTO } from "@/lib/constants";

// GET /api/gastos/[id] — descarga/visualiza el PDF del gasto (solo administradores)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const gasto = await prisma.gasto.findUnique({ where: { id } });
    if (!gasto) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
    }

    const bytes = new Uint8Array(gasto.datos);

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": gasto.tipoArchivo,
        "Content-Disposition": `inline; filename="${encodeURIComponent(gasto.nombreArchivo)}"`,
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(bytes.length),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/gastos/[id] — elimina un gasto (solo administradores)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const gasto = await prisma.gasto.delete({ where: { id } });

    await registrarActividad({
      tipo: "GASTO_ELIMINADO",
      descripcion: `${admin.nombre} eliminó un gasto de ${CATEGORIAS_GASTO[gasto.categoria as keyof typeof CATEGORIAS_GASTO]}`,
      usuarioId: admin.userId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
