import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

type TipoAccion =
  | "LOGIN"
  | "ENVIO_CREADO"
  | "ENVIO_EDITADO"
  | "ENVIO_ELIMINADO"
  | "ESTADO_CAMBIADO"
  | "COMENTARIO_ANADIDO"
  | "ADJUNTO_SUBIDO"
  | "ADJUNTO_ELIMINADO"
  | "USUARIO_CREADO"
  | "USUARIO_ACTUALIZADO"
  | "DOCUMENTO_SUBIDO"
  | "DOCUMENTO_ELIMINADO";

interface RegistrarActividadParams {
  tipo: TipoAccion;
  descripcion: string;
  usuarioId: string;
  entidadId?: string;
}

/**
 * Registra una acción en el log de actividad. Se usa "fire and forget" con
 * captura de errores: si el registro de auditoría falla, no debe romper la
 * operación principal que el usuario está realizando.
 */
export async function registrarActividad({
  tipo,
  descripcion,
  usuarioId,
  entidadId,
}: RegistrarActividadParams) {
  try {
    await prisma.registroActividad.create({
      data: {
        tipo: tipo as Prisma.RegistroActividadCreateInput["tipo"],
        descripcion,
        usuarioId,
        entidadId,
      },
    });
  } catch (error) {
    console.error("Error al registrar actividad:", error);
  }
}
