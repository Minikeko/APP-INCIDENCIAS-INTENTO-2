import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// POST /api/envios/[id]/estado — cambia el estado y registra el histórico
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { estadoNuevo, nota } = await req.json();

    if (!estadoNuevo) {
      return NextResponse.json(
        { error: "El nuevo estado es obligatorio" },
        { status: 400 }
      );
    }

    const envioActual = await prisma.envio.findUnique({ where: { id } });
    if (!envioActual) {
      return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 });
    }

    const [envio] = await prisma.$transaction([
      prisma.envio.update({
        where: { id },
        data: { estado: estadoNuevo },
      }),
      prisma.cambioEstado.create({
        data: {
          envioId: id,
          estadoAnterior: envioActual.estado,
          estadoNuevo,
          nota: nota?.trim() || null,
          creadoPorId: user.userId,
        },
      }),
    ]);

    return NextResponse.json({ envio });
  } catch (error) {
    return handleApiError(error);
  }
}
