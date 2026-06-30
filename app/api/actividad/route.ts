import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { Prisma } from "@prisma/client";

const PAGE_SIZE = 50;

// GET /api/actividad — lista el registro de actividad con filtros y paginación (solo administradores)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const tipo = searchParams.get("tipo");
    const usuarioId = searchParams.get("usuarioId");
    const pagina = Number(searchParams.get("pagina")) || 1;

    const where: Prisma.RegistroActividadWhereInput = {};
    if (tipo) where.tipo = tipo as Prisma.RegistroActividadWhereInput["tipo"];
    if (usuarioId) where.usuarioId = usuarioId;

    const [registros, total] = await Promise.all([
      prisma.registroActividad.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (pagina - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { usuario: { select: { nombre: true } } },
      }),
      prisma.registroActividad.count({ where }),
    ]);

    return NextResponse.json({
      registros,
      total,
      pagina,
      totalPaginas: Math.ceil(total / PAGE_SIZE),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
