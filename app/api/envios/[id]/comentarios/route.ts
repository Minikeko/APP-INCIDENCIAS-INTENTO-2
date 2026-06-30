import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// POST /api/envios/[id]/comentarios — añade un comentario/nota al envío
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { texto } = await req.json();

    if (!texto?.trim()) {
      return NextResponse.json(
        { error: "El comentario no puede estar vacío" },
        { status: 400 }
      );
    }

    const comentario = await prisma.comentario.create({
      data: {
        envioId: id,
        texto: texto.trim(),
        creadoPorId: user.userId,
      },
      include: { creadoPor: { select: { nombre: true } } },
    });

    // Refresca la marca de "última actualización" del envío
    await prisma.envio.update({
      where: { id },
      data: { ultimaActualizacion: new Date() },
    });

    return NextResponse.json({ comentario }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
