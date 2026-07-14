import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// POST /api/notas/[id]/compartir — actualiza con quién se comparte la nota
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { usuariosIds } = await req.json() as { usuariosIds: string[] };

    const nota = await prisma.nota.findUnique({ where: { id } });
    if (!nota) return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
    if (nota.autorId !== user.userId) {
      return NextResponse.json({ error: "Solo el autor puede compartir la nota" }, { status: 403 });
    }

    // Reemplazar la lista de compartidos
    await prisma.notaCompartida.deleteMany({ where: { notaId: id } });
    if (usuariosIds.length > 0) {
      await prisma.notaCompartida.createMany({
        data: usuariosIds
          .filter((uid) => uid !== user.userId)
          .map((userId) => ({ notaId: id, userId })),
        skipDuplicates: true,
      });
    }

    const actualizada = await prisma.nota.findUnique({
      where: { id },
      include: {
        compartidaCon: { include: { user: { select: { id: true, nombre: true } } } },
      },
    });

    return NextResponse.json({ nota: actualizada });
  } catch (error) {
    return handleApiError(error);
  }
}
