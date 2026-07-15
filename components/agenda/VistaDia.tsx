"use client";

import { Evento, HORAS, MESES, DIAS_SEMANA, mismaFecha, formatHora } from "./tipos";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface VistaDiaProps {
  fecha: Date;
  eventos: Evento[];
  onCambiarDia: (delta: number) => void;
  onHoraClick: (fecha: Date, hora: number) => void;
  onEventoClick: (ev: Evento) => void;
}

const ALTURA_HORA = 56;

export function VistaDia({ fecha, eventos, onCambiarDia, onHoraClick, onEventoClick }: VistaDiaProps) {
  const hoy = new Date();
  const esHoy = mismaFecha(fecha, hoy);
  const diaSemana = DIAS_SEMANA[(fecha.getDay() + 6) % 7];

  const eventosDelDia = eventos.filter((ev) => {
    const inicio = new Date(ev.fechaInicio);
    const fin = ev.fechaFin ? new Date(ev.fechaFin) : inicio;
    const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const i = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    const f = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
    return d >= i && d <= f;
  });

  const eventosTodoElDia = eventosDelDia.filter((ev) => {
    const inicio = new Date(ev.fechaInicio);
    const fin = ev.fechaFin ? new Date(ev.fechaFin) : inicio;
    return ev.todoElDia || inicio.toDateString() !== fin.toDateString();
  });

  const eventosHora = eventosDelDia.filter((ev) => {
    const inicio = new Date(ev.fechaInicio);
    const fin = ev.fechaFin ? new Date(ev.fechaFin) : inicio;
    return !ev.todoElDia && inicio.toDateString() === fin.toDateString();
  });

  function posicion(ev: Evento) {
    const inicio = new Date(ev.fechaInicio);
    const fin = ev.fechaFin ? new Date(ev.fechaFin) : new Date(inicio.getTime() + 3600000);
    const topMin = inicio.getHours() * 60 + inicio.getMinutes();
    const durMin = Math.max(30, (fin.getTime() - inicio.getTime()) / 60000);
    return { top: (topMin / 60) * ALTURA_HORA, height: Math.max(24, (durMin / 60) * ALTURA_HORA) };
  }

  const ahoraTop = esHoy
    ? ((hoy.getHours() * 60 + hoy.getMinutes()) / 60) * ALTURA_HORA
    : null;

  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg overflow-hidden flex flex-col h-full">
      {/* Cabecera */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)] shrink-0">
        <button onClick={() => onCambiarDia(-1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"><ChevronLeft size={18} /></button>
        <div className="text-center">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{diaSemana}</span>
          <div className="flex items-center gap-2 justify-center mt-0.5">
            <span className={`text-2xl font-mono font-bold ${esHoy ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>{fecha.getDate()}</span>
            <span className="text-sm text-[var(--text-secondary)]">{MESES[fecha.getMonth()]} {fecha.getFullYear()}</span>
          </div>
        </div>
        <button onClick={() => onCambiarDia(1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"><ChevronRight size={18} /></button>
      </div>

      {/* Eventos todo el día */}
      {eventosTodoElDia.length > 0 && (
        <div className="px-4 py-2 border-b border-[var(--border-subtle)] shrink-0 space-y-1">
          <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Todo el día</p>
          {eventosTodoElDia.map((ev) => (
            <div key={ev.id} onClick={() => onEventoClick(ev)} className="px-2 py-1 rounded text-white text-xs cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: ev.color }}>
              {ev.titulo}
            </div>
          ))}
        </div>
      )}

      {/* Cuadrícula de horas */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative" style={{ height: ALTURA_HORA * 24 }}>
          {/* Líneas de hora */}
          {HORAS.map((h) => (
            <div
              key={h}
              onClick={() => onHoraClick(fecha, h)}
              className="absolute w-full border-t border-[var(--border-subtle)] flex items-start hover:bg-[var(--bg-panel-raised)] cursor-pointer transition-colors"
              style={{ top: h * ALTURA_HORA, height: ALTURA_HORA }}
            >
              <span className="text-[10px] text-[var(--text-muted)] px-2 -mt-2 w-14 text-right shrink-0">{String(h).padStart(2, "0")}:00</span>
              <div className="flex-1 h-full" />
            </div>
          ))}

          {/* Eventos con hora */}
          {eventosHora.map((ev, idx) => {
            const { top, height } = posicion(ev);
            const inicio = new Date(ev.fechaInicio);
            const fin = ev.fechaFin ? new Date(ev.fechaFin) : new Date(inicio.getTime() + 3600000);
            return (
              <div
                key={ev.id}
                onClick={() => onEventoClick(ev)}
                className="absolute rounded-lg px-3 py-2 text-white cursor-pointer hover:opacity-90 transition-opacity shadow-sm z-10"
                style={{
                  top: top + 1,
                  height: height - 2,
                  left: `calc(56px + ${idx * 2}%)`,
                  right: "8px",
                  backgroundColor: ev.color,
                }}
              >
                <p className="text-xs font-semibold truncate">{ev.titulo}</p>
                <p className="text-[10px] opacity-80 mt-0.5">{formatHora(inicio)} – {formatHora(fin)}</p>
                {ev.descripcion && height > 60 && (
                  <p className="text-[10px] opacity-70 mt-1 line-clamp-2">{ev.descripcion}</p>
                )}
              </div>
            );
          })}

          {/* Línea de hora actual */}
          {ahoraTop !== null && (
            <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: ahoraTop }}>
              <div className="flex items-center">
                <span className="text-[9px] text-[var(--status-perdido)] w-14 text-right pr-1 font-mono">
                  {String(hoy.getHours()).padStart(2, "0")}:{String(hoy.getMinutes()).padStart(2, "0")}
                </span>
                <div className="flex-1 h-0.5 bg-[var(--status-perdido)] relative">
                  <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-[var(--status-perdido)]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
