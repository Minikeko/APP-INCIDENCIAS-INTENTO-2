import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

// GET /api/facturas-manuales — lista todas las facturas manuales
export async function GET() {
  try {
    await requireAdmin();
    const facturas = await prisma.facturaManual.findMany({
      orderBy: { fechaEmision: "desc" },
      include: {
        creadoPor: { select: { nombre: true } },
        lineas: { orderBy: { orden: "asc" } },
      },
    });
    return NextResponse.json({
      facturas: facturas.map((f: (typeof facturas)[number]) => ({
        ...f,
        baseImponible: Number(f.baseImponible),
        totalIva: Number(f.totalIva),
        total: Number(f.total),
        lineas: f.lineas.map((l: (typeof f.lineas)[number]) => ({
          ...l,
          cantidad: Number(l.cantidad),
          precioUnit: Number(l.precioUnit),
          total: Number(l.total),
        })),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/facturas-manuales — crea una nueva factura manual
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const {
      numeroFactura,
      fechaEmision,
      fechaVencimiento,
      clienteNombre,
      clienteNif,
      clienteDireccion,
      clienteEmail,
      albaranes,
      observaciones,
      tipoIva,
      lineas,
    } = body as {
      numeroFactura: string;
      fechaEmision: string;
      fechaVencimiento?: string;
      clienteNombre: string;
      clienteNif?: string;
      clienteDireccion?: string;
      clienteEmail?: string;
      albaranes?: string;
      observaciones?: string;
      tipoIva: number;
      lineas: { descripcion: string; cantidad: number; precioUnit: number }[];
    };

    if (!numeroFactura || !clienteNombre || !fechaEmision || !lineas?.length) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const lineasConTotal = lineas.map((l, i) => ({
      ...l,
      total: Number((l.cantidad * l.precioUnit).toFixed(2)),
      orden: i,
    }));

    const baseImponible = Number(lineasConTotal.reduce((s, l) => s + l.total, 0).toFixed(2));
    const totalIvaImporte = Number((baseImponible * tipoIva / 100).toFixed(2));
    const total = Number((baseImponible + totalIvaImporte).toFixed(2));

    const factura = await prisma.facturaManual.create({
      data: {
        numeroFactura,
        fechaEmision: new Date(fechaEmision),
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        clienteNombre,
        clienteNif: clienteNif || null,
        clienteDireccion: clienteDireccion || null,
        clienteEmail: clienteEmail || null,
        albaranes: albaranes || null,
        observaciones: observaciones || null,
        tipoIva,
        baseImponible,
        totalIva: totalIvaImporte,
        total,
        creadoPorId: admin.userId,
        lineas: {
          create: lineasConTotal,
        },
      },
      include: {
        lineas: { orderBy: { orden: "asc" } },
        creadoPor: { select: { nombre: true } },
      },
    });

    return NextResponse.json({
      factura: {
        ...factura,
        baseImponible: Number(factura.baseImponible),
        totalIva: Number(factura.totalIva),
        total: Number(factura.total),
        lineas: factura.lineas.map((l: (typeof factura.lineas)[number]) => ({
          ...l,
          cantidad: Number(l.cantidad),
          precioUnit: Number(l.precioUnit),
          total: Number(l.total),
        })),
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
