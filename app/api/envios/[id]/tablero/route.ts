import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

const COLUMNAS_VALIDAS = ["PENDIENTE", "SE_ACEPTA", "NO_SE_ACEPTA", "SOLUCIONADO"];

// PATCH /api/envios/[id]/tablero — mueve un envío a una columna del tablero
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;
    const { columna } = await req.json();

    if (!COLUMNAS_VALIDAS.includes(columna)) {
      return NextResponse.json({ error: "Columna no válida" }, { status: 400 });
    }

    const envio = await prisma.envio.update({
      where: { id },
      data: { columnaTablero: columna },
      select: { id: true, columnaTablero: true },
    });

    return NextResponse.json({ envio });
  } catch (error) {
    return handleApiError(error);
  }
}
