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

export const CATEGORIAS_GASTO = {
  COMBUSTIBLE: "Combustible",
  MATERIAL_SUMINISTROS: "Material y suministros",
  MANTENIMIENTO_VEHICULOS: "Mantenimiento de vehículos",
  DIETAS_DESPLAZAMIENTOS: "Dietas y desplazamientos",
  MATERIAL_OFICINA: "Material de oficina",
  OTROS: "Otros",
} as const;

export type CategoriaGastoKey = keyof typeof CATEGORIAS_GASTO;

export const CATEGORIAS_GASTO_LIST = Object.entries(CATEGORIAS_GASTO).map(
  ([key, label]) => ({ key: key as CategoriaGastoKey, label })
);

// Palabras clave para detectar automáticamente la categoría a partir de texto
// libre al importar gastos desde Excel. Se compara en minúsculas y sin acentos.
const PALABRAS_CLAVE_CATEGORIA: Record<CategoriaGastoKey, string[]> = {
  COMBUSTIBLE: ["combustible", "gasolina", "diesel", "gasoleo", "carburante", "repsol", "cepsa", "estacion de servicio"],
  MATERIAL_SUMINISTROS: ["material", "suministro", "almacen", "embalaje", "ferreteria"],
  MANTENIMIENTO_VEHICULOS: ["mantenimiento", "taller", "vehiculo", "furgoneta", "neumatico", "itv", "reparacion coche", "averia"],
  DIETAS_DESPLAZAMIENTOS: ["dieta", "desplazamiento", "viaje", "kilometraje", "peaje", "parking", "aparcamiento", "hotel", "restaurante", "comida"],
  MATERIAL_OFICINA: ["oficina", "papeleria", "impresora", "toner", "folios"],
  OTROS: [],
};

function quitarAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Intenta adivinar la categoría de gasto a partir de un texto libre (por
 * ejemplo, la columna de categoría o descripción de un Excel importado).
 * Si no reconoce ninguna palabra clave, devuelve OTROS.
 */
export function detectarCategoriaGasto(textoLibre: string): CategoriaGastoKey {
  const normalizado = quitarAcentos(textoLibre.toLowerCase());
  for (const [categoria, palabras] of Object.entries(PALABRAS_CLAVE_CATEGORIA)) {
    if (palabras.some((palabra) => normalizado.includes(palabra))) {
      return categoria as CategoriaGastoKey;
    }
  }
  return "OTROS";
}
