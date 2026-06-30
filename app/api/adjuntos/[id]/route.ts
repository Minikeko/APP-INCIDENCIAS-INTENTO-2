import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// GET /api/adjuntos/[id] — descarga/visualiza el archivo
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;

    const adjunto = await prisma.adjunto.findUnique({ where: { id } });
    if (!adjunto) {
      return NextResponse.json({ error: "Adjunto no encontrado" }, { status: 404 });
    }

    const bytes = new Uint8Array(adjunto.datos);

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": adjunto.tipoArchivo,
        "Content-Disposition": `inline; filename="${encodeURIComponent(adjunto.nombreArchivo)}"`,
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(bytes.length),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/adjuntos/[id] — elimina un adjunto
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;
    await prisma.adjunto.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
