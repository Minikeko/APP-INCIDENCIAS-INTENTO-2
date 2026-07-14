import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { generarPdfFactura } from "@/lib/pdf-factura";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const factura = await prisma.facturaManual.findUnique({
      where: { id },
      include: { lineas: { orderBy: { orden: "asc" } } },
    });
    if (!factura) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    const pdfBytesRaw = await generarPdfFactura({
      numeroFactura: factura.numeroFactura,
      fechaEmision: factura.fechaEmision,
      fechaVencimiento: factura.fechaVencimiento,
      clienteNombre: factura.clienteNombre,
      clienteNif: factura.clienteNif,
      clienteDireccion: factura.clienteDireccion,
      clienteEmail: factura.clienteEmail,
      albaranes: factura.albaranes,
      observaciones: factura.observaciones,
      lineas: factura.lineas.map((l: (typeof factura.lineas)[number]) => ({
        descripcion: l.descripcion,
        cantidad: Number(l.cantidad),
        precioUnit: Number(l.precioUnit),
        total: Number(l.total),
      })),
      baseImponible: Number(factura.baseImponible),
      tipoIva: factura.tipoIva,
      totalIva: Number(factura.totalIva),
      total: Number(factura.total),
    });
    const pdfBytes: Uint8Array<ArrayBuffer> = new Uint8Array(pdfBytesRaw.buffer as ArrayBuffer);

    const nombre = `factura-${factura.numeroFactura.replace(/[^a-zA-Z0-9-]/g, "-")}.pdf`;
    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${nombre}"`,
        "Content-Length": String(pdfBytes.length),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
