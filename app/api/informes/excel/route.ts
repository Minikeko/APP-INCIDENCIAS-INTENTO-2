import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { ESTADOS } from "@/lib/constants";
import ExcelJS from "exceljs";
import { Prisma } from "@prisma/client";

// GET /api/informes/excel — genera un informe Excel de envíos, con filtros opcionales
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);

    const estado = searchParams.get("estado");
    const mensajero = searchParams.get("mensajero");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const where: Prisma.EnvioWhereInput = {};
    if (estado) where.estado = estado as Prisma.EnvioWhereInput["estado"];
    if (mensajero) where.mensajero = { equals: mensajero, mode: "insensitive" };
    if (desde || hasta) {
      where.createdAt = {
        ...(desde && { gte: new Date(desde) }),
        ...(hasta && { lte: new Date(hasta) }),
      };
    }

    const envios = await prisma.envio.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { creadoPor: { select: { nombre: true } } },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Control de Envíos";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Envíos");

    sheet.columns = [
      { header: "Nº Seguimiento", key: "numeroSeguimiento", width: 22 },
      { header: "Mensajero", key: "mensajero", width: 18 },
      { header: "Estado", key: "estado", width: 18 },
      { header: "Motivo", key: "motivo", width: 28 },
      { header: "Descripción", key: "descripcion", width: 40 },
      { header: "Destinatario", key: "destinatario", width: 22 },
      { header: "Dirección", key: "direccion", width: 30 },
      { header: "Fecha de envío", key: "fechaEnvio", width: 16 },
      { header: "Fecha en la que se informa", key: "fechaInforme", width: 20 },
      { header: "Última actualización", key: "ultimaActualizacion", width: 20 },
      { header: "Registrado por", key: "creadoPor", width: 18 },
      { header: "Fecha de registro", key: "createdAt", width: 18 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF232730" },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: "FFE8E6E1" } };

    for (const envio of envios) {
      sheet.addRow({
        numeroSeguimiento: envio.numeroSeguimiento,
        mensajero: envio.mensajero,
        estado: ESTADOS[envio.estado as keyof typeof ESTADOS]?.label || envio.estado,
        motivo: envio.motivo || "",
        descripcion: envio.descripcion || "",
        destinatario: envio.destinatario || "",
        direccion: envio.direccion || "",
        fechaEnvio: envio.fechaEnvio
          ? envio.fechaEnvio.toLocaleDateString("es-ES")
          : "",
        fechaInforme: envio.fechaInforme
          ? envio.fechaInforme.toLocaleDateString("es-ES")
          : "",
        ultimaActualizacion: envio.ultimaActualizacion.toLocaleString("es-ES"),
        creadoPor: envio.creadoPor.nombre,
        createdAt: envio.createdAt.toLocaleDateString("es-ES"),
      });
    }

    sheet.autoFilter = {
      from: "A1",
      to: `L${envios.length + 1}`,
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const fecha = new Date().toISOString().slice(0, 10);

    // Convertimos explícitamente el Buffer de Node a Uint8Array: NextResponse
    // espera tipos de la Web API estándar, y aunque Buffer es técnicamente
    // compatible, esta conversión explícita evita cualquier ambigüedad de
    // serialización al pasar por el proxy/runtime de producción.
    const bytes = new Uint8Array(buffer);

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="informe-envios-${fecha}.xlsx"`,
        "Content-Length": String(bytes.length),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
