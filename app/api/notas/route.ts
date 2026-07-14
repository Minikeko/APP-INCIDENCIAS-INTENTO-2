import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// GET /api/notas — notas propias + notas compartidas conmigo
export async function GET() {
  try {
    const user = await requireUser();

    const [propias, compartidas] = await Promise.all([
      prisma.nota.findMany({
        where: { autorId: user.userId },
        include: {
          compartidaCon: { include: { user: { select: { id: true, nombre: true } } } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.nota.findMany({
        where: { compartidaCon: { some: { userId: user.userId } } },
        include: {
          autor: { select: { id: true, nombre: true } },
          compartidaCon: { include: { user: { select: { id: true, nombre: true } } } },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return NextResponse.json({ propias, compartidas });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/notas — crea una nota
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { titulo, contenido, color } = await req.json() as {
      titulo: string;
      contenido: string;
      color?: string;
    };

    if (!titulo || !contenido) {
      return NextResponse.json({ error: "Título y contenido son obligatorios" }, { status: 400 });
    }

    const nota = await prisma.nota.create({
      data: {
        titulo,
        contenido,
        color: color || "#e8a33d",
        autorId: user.userId,
      },
      include: {
        compartidaCon: { include: { user: { select: { id: true, nombre: true } } } },
      },
    });

    return NextResponse.json({ nota }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
