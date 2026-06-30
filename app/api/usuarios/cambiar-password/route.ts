import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { hashPassword, verifyPassword } from "@/lib/auth";

// POST /api/usuarios/cambiar-password — el usuario autenticado cambia su propia contraseña
export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();
    const { passwordActual, passwordNueva } = await req.json();

    if (!passwordActual || !passwordNueva) {
      return NextResponse.json(
        { error: "Debes indicar tu contraseña actual y la nueva" },
        { status: 400 }
      );
    }

    if (passwordNueva.length < 8) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const usuario = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const passwordCorrecta = await verifyPassword(passwordActual, usuario.passwordHash);
    if (!passwordCorrecta) {
      return NextResponse.json(
        { error: "La contraseña actual no es correcta" },
        { status: 401 }
      );
    }

    const nuevoHash = await hashPassword(passwordNueva);

    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: nuevoHash },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
