import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// GET /api/usuario/avatar/[id] — devuelve el avatar de un usuario por ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { avatarDatos: true, avatarTipo: true },
    });

    if (!user?.avatarDatos) {
      return NextResponse.json({ error: "Sin avatar" }, { status: 404 });
    }

    const bytes = new Uint8Array(user.avatarDatos);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": user.avatarTipo || "image/jpeg",
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(bytes.length),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
