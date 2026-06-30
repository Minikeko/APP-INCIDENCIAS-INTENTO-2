export const ESTADOS = {
  EN_TRANSITO: {
    label: "En tránsito",
    color: "var(--status-transito)",
    bg: "rgba(91, 155, 213, 0.12)",
  },
  RETRASADO: {
    label: "Retrasado",
    color: "var(--status-retrasado)",
    bg: "rgba(251, 191, 36, 0.12)",
  },
  PERDIDO: {
    label: "Perdido",
    color: "var(--status-perdido)",
    bg: "rgba(248, 113, 113, 0.12)",
  },
  EN_INVESTIGACION: {
    label: "En investigación",
    color: "var(--status-investigacion)",
    bg: "rgba(192, 132, 252, 0.12)",
  },
  ENCONTRADO: {
    label: "Encontrado",
    color: "var(--status-encontrado)",
    bg: "rgba(56, 189, 248, 0.12)",
  },
  MAL_ENTREGADO: {
    label: "Mal entregado",
    color: "var(--status-mal-entregado)",
    bg: "rgba(251, 146, 60, 0.12)",
  },
  ENTREGADO: {
    label: "Entregado",
    color: "var(--status-entregado)",
    bg: "rgba(74, 222, 128, 0.12)",
  },
  DEVUELTO: {
    label: "Devuelto",
    color: "var(--status-devuelto)",
    bg: "rgba(148, 163, 184, 0.12)",
  },
  RESUELTO: {
    label: "Resuelto",
    color: "var(--status-resuelto)",
    bg: "rgba(74, 222, 128, 0.12)",
  },
} as const;

export type EstadoKey = keyof typeof ESTADOS;

export const ESTADOS_LIST = Object.entries(ESTADOS).map(([key, value]) => ({
  key: key as EstadoKey,
  ...value,
}));

// Estados que cuentan como "abierto" / requieren atención para las alertas
export const ESTADOS_ABIERTOS: EstadoKey[] = [
  "EN_TRANSITO",
  "RETRASADO",
  "PERDIDO",
  "EN_INVESTIGACION",
  "ENCONTRADO",
  "MAL_ENTREGADO",
];

export const ROLES = {
  ADMIN: "Administrador",
  OPERADOR: "Operador",
} as const;
