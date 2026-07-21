import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// GET /api/notas/adjuntos/[adjuntoId] — descarga el adjunto
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ adjuntoId: string }> }
) {
  try {
    const user = await requireUser();
    const { adjuntoId } = await params;

    const adjunto = await prisma.notaAdjunto.findUnique({
      where: { id: adjuntoId },
      include: {
        nota: { include: { compartidaCon: { select: { userId: true } } } },
      },
    });
    if (!adjunto) return NextResponse.json({ error: "Adjunto no encontrado" }, { status: 404 });

    const tieneAcceso =
      adjunto.nota.autorId === user.userId ||
      adjunto.nota.compartidaCon.some((c: { userId: string }) => c.userId === user.userId);
    if (!tieneAcceso) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

    const bytes = new Uint8Array(adjunto.datos);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": adjunto.tipoArchivo,
        "Content-Disposition": `inline; filename="${encodeURIComponent(adjunto.nombreArchivo)}"`,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/notas/adjuntos/[adjuntoId] — elimina el adjunto (solo el autor de la nota)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ adjuntoId: string }> }
) {
  try {
    const user = await requireUser();
    const { adjuntoId } = await params;

    const adjunto = await prisma.notaAdjunto.findUnique({
      where: { id: adjuntoId },
      include: { nota: { select: { autorId: true } } },
    });
    if (!adjunto) return NextResponse.json({ error: "Adjunto no encontrado" }, { status: 404 });
    if (adjunto.nota.autorId !== user.userId) {
      return NextResponse.json({ error: "Solo el autor puede eliminar adjuntos" }, { status: 403 });
    }

    await prisma.notaAdjunto.delete({ where: { id: adjuntoId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
