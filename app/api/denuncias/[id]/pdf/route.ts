import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { generarPdfDenuncia } from "@/lib/pdf-denuncia";

// GET /api/denuncias/[id]/pdf — descarga el PDF de la denuncia.
// Si la denuncia tiene un PDF original subido, se descarga ese.
// Si no, se genera al vuelo a partir del contenido escrito en la app.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const denuncia = await prisma.denuncia.findUnique({
      where: { id },
      include: {
        creadoPor: { select: { nombre: true } },
        envios: {
          select: {
            envio: { select: { numeroSeguimiento: true, mensajero: true } },
          },
        },
      },
    });

    if (!denuncia) {
      return NextResponse.json({ error: "Denuncia no encontrada" }, { status: 404 });
    }

    // Caso 1: hay un PDF original subido, lo servimos directamente
    if (denuncia.archivoOriginalDatos) {
      const bytes = new Uint8Array(denuncia.archivoOriginalDatos);
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": denuncia.archivoOriginalTipo || "application/pdf",
          "Content-Disposition": `inline; filename="${encodeURIComponent(
            denuncia.archivoOriginalNombre || "denuncia.pdf"
          )}"`,
          "Content-Length": String(bytes.length),
        },
      });
    }

    // Caso 2: se genera el PDF al vuelo con el membrete corporativo
    const pdfBytes = await generarPdfDenuncia({
      titulo: denuncia.titulo,
      descripcion: denuncia.descripcion,
      fecha: denuncia.fecha,
      creadoPor: denuncia.creadoPor.nombre,
      envios: denuncia.envios.map((e: (typeof denuncia.envios)[number]) => e.envio),
    });

    const nombreArchivo = `denuncia-${denuncia.titulo
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 50)}.pdf`;

    const bytes = new Uint8Array(pdfBytes);

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${nombreArchivo}"`,
        "Content-Length": String(bytes.length),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
