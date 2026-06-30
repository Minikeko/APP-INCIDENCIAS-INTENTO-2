import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { ESTADOS_ABIERTOS } from "@/lib/constants";

// GET /api/estadisticas — datos agregados de envíos (solo administradores)
export async function GET() {
  try {
    await requireAdmin();

    const [porEstado, porMensajero, total, abiertos, ultimos30dias] = await Promise.all([
      prisma.envio.groupBy({
        by: ["estado"],
        _count: { _all: true },
      }),
      prisma.envio.groupBy({
        by: ["mensajero"],
        _count: { _all: true },
        orderBy: { _count: { mensajero: "desc" } },
        take: 10,
      }),
      prisma.envio.count(),
      prisma.envio.count({ where: { estado: { in: ESTADOS_ABIERTOS } } }),
      prisma.envio.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return NextResponse.json({
      total,
      abiertos,
      cerrados: total - abiertos,
      ultimos30dias,
      porEstado: porEstado.map((e: (typeof porEstado)[number]) => ({
        estado: e.estado,
        cantidad: e._count._all,
      })),
      porMensajero: porMensajero.map((m: (typeof porMensajero)[number]) => ({
        mensajero: m.mensajero,
        cantidad: m._count._all,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
