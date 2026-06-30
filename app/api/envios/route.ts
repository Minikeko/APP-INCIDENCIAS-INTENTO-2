import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { Prisma } from "@prisma/client";

// GET /api/envios — lista envíos con filtros opcionales
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);

    const estado = searchParams.get("estado");
    const mensajero = searchParams.get("mensajero");
    const busqueda = searchParams.get("q");

    const where: Prisma.EnvioWhereInput = {};

    if (estado) {
      where.estado = estado as Prisma.EnvioWhereInput["estado"];
    }
    if (mensajero) {
      where.mensajero = { equals: mensajero, mode: "insensitive" };
    }
    if (busqueda) {
      where.OR = [
        { numeroSeguimiento: { contains: busqueda, mode: "insensitive" } },
        { destinatario: { contains: busqueda, mode: "insensitive" } },
        { descripcion: { contains: busqueda, mode: "insensitive" } },
      ];
    }

    const envios = await prisma.envio.findMany({
      where,
      orderBy: { ultimaActualizacion: "desc" },
      include: {
        creadoPor: { select: { nombre: true } },
        _count: { select: { adjuntos: true, comentarios: true } },
      },
    });

    return NextResponse.json({ envios });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/envios — crea un nuevo envío
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const {
      numeroSeguimiento,
      mensajero,
      estado,
      motivo,
      descripcion,
      destinatario,
      direccion,
      fechaEnvio,
    } = body;

    if (!numeroSeguimiento || !mensajero) {
      return NextResponse.json(
        { error: "El número de seguimiento y el mensajero son obligatorios" },
        { status: 400 }
      );
    }

    const existente = await prisma.envio.findUnique({
      where: { numeroSeguimiento: numeroSeguimiento.trim() },
    });
    if (existente) {
      return NextResponse.json(
        { error: "Ya existe un envío con ese número de seguimiento" },
        { status: 409 }
      );
    }

    const envio = await prisma.envio.create({
      data: {
        numeroSeguimiento: numeroSeguimiento.trim(),
        mensajero: mensajero.trim(),
        estado: estado || "EN_TRANSITO",
        motivo: motivo?.trim() || null,
        descripcion: descripcion?.trim() || null,
        destinatario: destinatario?.trim() || null,
        direccion: direccion?.trim() || null,
        fechaEnvio: fechaEnvio ? new Date(fechaEnvio) : null,
        creadoPorId: user.userId,
        cambiosEstado: {
          create: {
            estadoNuevo: estado || "EN_TRANSITO",
            nota: "Envío registrado",
            creadoPorId: user.userId,
          },
        },
      },
    });

    return NextResponse.json({ envio }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
