import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { hashPassword } from "@/lib/auth";

// GET /api/usuarios — lista usuarios del equipo (cualquier usuario autenticado puede ver la lista, p.ej. para el filtro de "creado por")
export async function GET() {
  try {
    await requireUser();
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
        activo: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ usuarios });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/usuarios — crea un nuevo usuario del equipo (solo admin)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { email, nombre, password, role } = await req.json();

    if (!email || !nombre || !password) {
      return NextResponse.json(
        { error: "Email, nombre y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const existente = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existente) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const usuario = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        nombre: nombre.trim(),
        passwordHash,
        role: role === "ADMIN" ? "ADMIN" : "OPERADOR",
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
        activo: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ usuario }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
