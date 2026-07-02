import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// GET /api/preferencias — obtiene las preferencias del usuario actual
export async function GET() {
  try {
    const user = await requireUser();

    const prefs = await prisma.preferenciaUsuario.upsert({
      where: { userId: user.userId },
      create: { userId: user.userId },
      update: {},
    });

    return NextResponse.json({
      tema: prefs.tema,
      notificacionesSilenciadas: JSON.parse(prefs.notificacionesSilenciadas),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/preferencias — actualiza preferencias del usuario actual
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { tema, notificacionesSilenciadas } = body as {
      tema?: string;
      notificacionesSilenciadas?: string[];
    };

    const prefs = await prisma.preferenciaUsuario.upsert({
      where: { userId: user.userId },
      create: {
        userId: user.userId,
        ...(tema ? { tema } : {}),
        ...(notificacionesSilenciadas !== undefined
          ? { notificacionesSilenciadas: JSON.stringify(notificacionesSilenciadas) }
          : {}),
      },
      update: {
        ...(tema ? { tema } : {}),
        ...(notificacionesSilenciadas !== undefined
          ? { notificacionesSilenciadas: JSON.stringify(notificacionesSilenciadas) }
          : {}),
      },
    });

    return NextResponse.json({
      tema: prefs.tema,
      notificacionesSilenciadas: JSON.parse(prefs.notificacionesSilenciadas),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
