import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// GET /api/notificaciones — lista las notificaciones del usuario actual
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const soloNoLeidas = searchParams.get("noLeidas") === "1";

    const notificaciones = await prisma.notificacion.findMany({
      where: {
        userId: user.userId,
        ...(soloNoLeidas ? { leida: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const totalNoLeidas = await prisma.notificacion.count({
      where: { userId: user.userId, leida: false },
    });

    return NextResponse.json({ notificaciones, totalNoLeidas });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/notificaciones — marcar todas como leídas
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { id } = body as { id?: string };

    if (id) {
      // Marcar una específica
      await prisma.notificacion.updateMany({
        where: { id, userId: user.userId },
        data: { leida: true },
      });
    } else {
      // Marcar todas
      await prisma.notificacion.updateMany({
        where: { userId: user.userId, leida: false },
        data: { leida: true },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
