import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

// GET /api/usuario/avatar/[id] — devuelve el avatar de un usuario
// (ruta pública autenticada, cualquier usuario puede ver el avatar de otro)
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

// POST /api/usuario/avatar — sube el avatar del usuario actual
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se ha enviado ningún archivo" }, { status: 400 });
    }
    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json({ error: "La imagen supera el tamaño máximo (2MB)" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const avatarDatos: Uint8Array<ArrayBuffer> = new Uint8Array(arrayBuffer);

    await prisma.user.update({
      where: { id: user.userId },
      data: { avatarDatos, avatarTipo: file.type },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/usuario/avatar — elimina el avatar del usuario actual
export async function DELETE() {
  try {
    const user = await requireUser();
    await prisma.user.update({
      where: { id: user.userId },
      data: { avatarDatos: null, avatarTipo: null },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
