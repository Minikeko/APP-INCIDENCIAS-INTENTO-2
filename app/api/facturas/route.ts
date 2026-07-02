import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { registrarActividad } from "@/lib/actividad";

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

// GET /api/facturas — lista documentos de facturación (solo administradores)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const anio = searchParams.get("anio");
    const clienteProveedor = searchParams.get("clienteProveedor");

    const documentos = await prisma.documentoFactura.findMany({
      where: {
        ...(anio && { anio: Number(anio) }),
        ...(clienteProveedor && {
          clienteProveedor: { equals: clienteProveedor, mode: "insensitive" },
        }),
      },
      orderBy: [{ anio: "desc" }, { mes: "desc" }],
      include: { subidoPor: { select: { nombre: true } } },
    });

    // Decimal de Prisma no serializa directamente a JSON limpio, lo convertimos a número
    const documentosSerializados = documentos.map((d: (typeof documentos)[number]) => ({
      ...d,
      importe: d.importe ? Number(d.importe) : null,
    }));

    return NextResponse.json({ documentos: documentosSerializados });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/facturas — sube un nuevo documento de factura (solo administradores)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mes = Number(formData.get("mes"));
    const anio = Number(formData.get("anio"));
    const clienteProveedor = (formData.get("clienteProveedor") as string)?.trim();
    const numeroFactura = (formData.get("numeroFactura") as string)?.trim() || null;
    const importeRaw = formData.get("importe") as string | null;
    const importe = importeRaw ? Number(importeRaw) : null;

    if (!file) {
      return NextResponse.json({ error: "No se ha enviado ningún archivo" }, { status: 400 });
    }
    if (!mes || mes < 1 || mes > 12) {
      return NextResponse.json({ error: "El mes no es válido" }, { status: 400 });
    }
    if (!anio || anio < 2000) {
      return NextResponse.json({ error: "El año no es válido" }, { status: 400 });
    }
    if (!clienteProveedor) {
      return NextResponse.json(
        { error: "El cliente/proveedor es obligatorio" },
        { status: 400 }
      );
    }
    if (importeRaw && Number.isNaN(importe)) {
      return NextResponse.json({ error: "El importe no es válido" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo supera el tamaño máximo permitido (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }
    const arrayBuffer = await file.arrayBuffer();
    const datos: Uint8Array<ArrayBuffer> = new Uint8Array(arrayBuffer);

    const documento = await prisma.documentoFactura.create({
      data: {
        nombreArchivo: file.name,
        tipoArchivo: file.type,
        tamano: file.size,
        datos,
        mes,
        anio,
        clienteProveedor,
        numeroFactura,
        importe,
        subidoPorId: admin.userId,
      },
      select: {
        id: true,
        nombreArchivo: true,
        tipoArchivo: true,
        tamano: true,
        mes: true,
        anio: true,
        clienteProveedor: true,
        numeroFactura: true,
        importe: true,
        createdAt: true,
      },
    });

    await registrarActividad({
      tipo: "DOCUMENTO_SUBIDO",
      descripcion: `${admin.nombre} subió una factura de ${clienteProveedor} (${mes}/${anio})`,
      usuarioId: admin.userId,
      entidadId: documento.id,
    });

    return NextResponse.json(
      { documento: { ...documento, importe: documento.importe ? Number(documento.importe) : null } },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
