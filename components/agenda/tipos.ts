export interface Participante {
  user: { id: string; nombre: string };
}

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  todoElDia: boolean;
  color: string;
  creadoPor: { id: string; nombre: string };
  participantes: Participante[];
}

export type Vista = "mes" | "semana" | "dia";

export const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
export const DIAS_SEMANA = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
export const DIAS_SEMANA_CORTO = ["L","M","X","J","V","S","D"];
export const COLORES = ["#e8a33d","#f87171","#4ade80","#60a5fa","#c084fc","#fb923c","#f472b6","#34d399"];
export const HORAS = Array.from({ length: 24 }, (_, i) => i);

/** Devuelve true si el evento ocupa el día dado */
export function eventoEnDia(ev: Evento, fecha: Date): boolean {
  const inicio = new Date(ev.fechaInicio);
  const fin = ev.fechaFin ? new Date(ev.fechaFin) : inicio;
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const i = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const f = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
  return d >= i && d <= f;
}

/** Devuelve true si el evento empieza este día (para saber si pintar la cabecera) */
export function eventoEmpiezaEnDia(ev: Evento, fecha: Date): boolean {
  const inicio = new Date(ev.fechaInicio);
  return (
    inicio.getFullYear() === fecha.getFullYear() &&
    inicio.getMonth() === fecha.getMonth() &&
    inicio.getDate() === fecha.getDate()
  );
}

/** Devuelve true si el evento termina este día */
export function eventoTerminaEnDia(ev: Evento, fecha: Date): boolean {
  const fin = ev.fechaFin ? new Date(ev.fechaFin) : new Date(ev.fechaInicio);
  return (
    fin.getFullYear() === fecha.getFullYear() &&
    fin.getMonth() === fecha.getMonth() &&
    fin.getDate() === fecha.getDate()
  );
}

export function mismaFecha(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function formatHora(date: Date): string {
  return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

/** Primer lunes de la semana que contiene la fecha dada */
export function primerLunesDeSemana(fecha: Date): Date {
  const d = new Date(fecha);
  const dia = d.getDay(); // 0=dom, 1=lun...
  const offset = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Devuelve los 7 días de la semana a partir del lunes dado */
export function diasDeSemana(lunes: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
}
