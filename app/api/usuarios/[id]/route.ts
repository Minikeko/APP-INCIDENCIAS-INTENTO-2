import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// PATCH /api/usuarios/[id] — activa/desactiva un usuario o cambia su rol (solo admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { activo, role } = await req.json();

    if (id === admin.userId && activo === false) {
      return NextResponse.json(
        { error: "No puedes desactivar tu propia cuenta" },
        { status: 400 }
      );
    }

    const usuario = await prisma.user.update({
      where: { id },
      data: {
        ...(activo !== undefined && { activo }),
        ...(role !== undefined && { role }),
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
        activo: true,
      },
    });

    return NextResponse.json({ usuario });
  } catch (error) {
    return handleApiError(error);
  }
}
