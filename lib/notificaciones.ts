import { prisma } from "./prisma";

type TipoNotificacion = "MENSAJE_NUEVO" | "MENCION" | "ESTADO_ENVIO_CAMBIADO" | "ENVIO_ASIGNADO";

interface CrearNotificacionParams {
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  url?: string;
  usuarioIds: string[]; // destinatarios
  excluyendo?: string;  // no notificar al propio autor
}

/**
 * Crea notificaciones para los usuarios indicados, respetando sus
 * preferencias de silencio para ese tipo de notificación.
 */
export async function crearNotificaciones({
  tipo,
  titulo,
  cuerpo,
  url,
  usuarioIds,
  excluyendo,
}: CrearNotificacionParams): Promise<void> {
  const destinatarios = usuarioIds.filter((id) => id !== excluyendo);
  if (destinatarios.length === 0) return;

  // Obtener preferencias para filtrar silenciados
  const preferencias = await prisma.preferenciaUsuario.findMany({
    where: { userId: { in: destinatarios } },
    select: { userId: true, notificacionesSilenciadas: true },
  });

  const silenciadosPorUsuario = new Map<string, string[]>(
    preferencias.map((p: { userId: string; notificacionesSilenciadas: string }) => [
      p.userId,
      JSON.parse(p.notificacionesSilenciadas) as string[],
    ])
  );

  const destinatariosActivos = destinatarios.filter((userId) => {
    const silenciados: string[] = silenciadosPorUsuario.get(userId) ?? [];
    return !silenciados.includes(tipo);
  });

  if (destinatariosActivos.length === 0) return;

  await prisma.notificacion.createMany({
    data: destinatariosActivos.map((userId) => ({
      tipo,
      titulo,
      cuerpo,
      url: url ?? null,
      userId,
    })),
  });
}
