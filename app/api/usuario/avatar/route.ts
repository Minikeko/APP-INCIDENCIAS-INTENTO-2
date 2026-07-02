import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

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
