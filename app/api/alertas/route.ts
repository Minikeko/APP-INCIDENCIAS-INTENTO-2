import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { ESTADOS_ABIERTOS } from "@/lib/constants";

// GET /api/alertas — envíos abiertos sin actualizar en más de N días, o perdidos
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const dias = Number(searchParams.get("dias")) || 3;

    const limite = new Date();
    limite.setDate(limite.getDate() - dias);

    const [sinActualizar, perdidos] = await Promise.all([
      prisma.envio.findMany({
        where: {
          estado: { in: ESTADOS_ABIERTOS },
          ultimaActualizacion: { lt: limite },
        },
        orderBy: { ultimaActualizacion: "asc" },
        include: { creadoPor: { select: { nombre: true } } },
      }),
      prisma.envio.findMany({
        where: { estado: "PERDIDO" },
        orderBy: { ultimaActualizacion: "desc" },
        include: { creadoPor: { select: { nombre: true } } },
      }),
    ]);

    return NextResponse.json({ sinActualizar, perdidos, diasUmbral: dias });
  } catch (error) {
    return handleApiError(error);
  }
}
