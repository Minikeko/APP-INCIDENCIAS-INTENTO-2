"use client";

import { Evento, DIAS_SEMANA, HORAS, diasDeSemana, primerLunesDeSemana, eventoEnDia, mismaFecha, formatHora } from "./tipos";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface VistaSemanaProps {
  fechaRef: Date;
  eventos: Evento[];
  onCambiarSemana: (delta: number) => void;
  onHoraClick: (fecha: Date, hora: number) => void;
  onEventoClick: (ev: Evento) => void;
  onDiaClick: (fecha: Date) => void;
}

const ALTURA_HORA = 48; // px por hora

export function VistaSemana({ fechaRef, eventos, onCambiarSemana, onHoraClick, onEventoClick, onDiaClick }: VistaSemanaProps) {
  const hoy = new Date();
  const lunes = primerLunesDeSemana(fechaRef);
  const dias = diasDeSemana(lunes);

  const fin = new Date(dias[6]);
  fin.setHours(23, 59, 59);
  const labelSemana = dias[0].getDate() === 1 || dias[6].getMonth() !== dias[0].getMonth()
    ? `${dias[0].getDate()} ${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][dias[0].getMonth()]} – ${dias[6].getDate()} ${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][dias[6].getMonth()]} ${dias[6].getFullYear()}`
    : `${dias[0].getDate()} – ${dias[6].getDate()} ${["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][dias[0].getMonth()]} ${dias[0].getFullYear()}`;

  // Eventos de todo el día o multi-día (van arriba)
  function eventosTodoElDia(dia: Date): Evento[] {
    return eventos.filter((ev) => {
      if (!eventoEnDia(ev, dia)) return false;
      const inicio = new Date(ev.fechaInicio);
      const ffin = ev.fechaFin ? new Date(ev.fechaFin) : inicio;
      const multidia = inicio.toDateString() !== ffin.toDateString();
      return ev.todoElDia || multidia;
    });
  }

  // Eventos con hora específica (van en la cuadrícula)
  function eventosConHora(dia: Date): Evento[] {
    return eventos.filter((ev) => {
      if (!eventoEnDia(ev, dia)) return false;
      const inicio = new Date(ev.fechaInicio);
      const ffin = ev.fechaFin ? new Date(ev.fechaFin) : inicio;
      const multidia = inicio.toDateString() !== ffin.toDateString();
      return !ev.todoElDia && !multidia;
    });
  }

  function posicionEvento(ev: Evento) {
    const inicio = new Date(ev.fechaInicio);
    const ffin = ev.fechaFin ? new Date(ev.fechaFin) : new Date(inicio.getTime() + 60 * 60 * 1000);
    const topMin = inicio.getHours() * 60 + inicio.getMinutes();
    const durMin = Math.max(30, (ffin.getTime() - inicio.getTime()) / 60000);
    return {
      top: (topMin / 60) * ALTURA_HORA,
      height: Math.max(20, (durMin / 60) * ALTURA_HORA),
    };
  }

  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg overflow-hidden flex flex-col h-full">
      {/* Cabecera */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)] shrink-0">
        <button onClick={() => onCambiarSemana(-1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"><ChevronLeft size={18} /></button>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{labelSemana}</span>
        <button onClick={() => onCambiarSemana(1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"><ChevronRight size={18} /></button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-8 border-b border-[var(--border-subtle)] shrink-0">
        <div className="w-12" />
        {dias.map((dia, i) => {
          const esHoy = mismaFecha(dia, hoy);
          return (
            <button key={i} onClick={() => onDiaClick(dia)} className="py-2 text-center hover:bg-[var(--bg-panel-raised)] transition-colors">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">{DIAS_SEMANA[i]}</span>
              <span className={`text-sm font-mono w-7 h-7 flex items-center justify-center rounded-full mx-auto mt-0.5 ${esHoy ? "bg-[var(--accent)] text-[#1a1408] font-bold" : "text-[var(--text-secondary)]"}`}>{dia.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Banda de eventos todo el día */}
      {dias.some((d) => eventosTodoElDia(d).length > 0) && (
        <div className="grid grid-cols-8 border-b border-[var(--border-subtle)] shrink-0 min-h-[28px]">
          <div className="text-[9px] text-[var(--text-muted)] flex items-center justify-center px-1">Todo el día</div>
          {dias.map((dia, i) => (
            <div key={i} className="p-0.5 space-y-0.5 border-r border-[var(--border-subtle)] last:border-r-0">
              {eventosTodoElDia(dia).map((ev) => (
                <div key={ev.id} onClick={() => onEventoClick(ev)} className="text-[10px] px-1 py-0.5 rounded text-white cursor-pointer hover:opacity-80 truncate" style={{ backgroundColor: ev.color }}>
                  {ev.titulo}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Cuadrícula de horas */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8" style={{ height: ALTURA_HORA * 24 }}>
          {/* Columna de horas */}
          <div className="relative">
            {HORAS.map((h) => (
              <div key={h} className="absolute w-full border-t border-[var(--border-subtle)] flex items-start justify-end pr-2" style={{ top: h * ALTURA_HORA, height: ALTURA_HORA }}>
                <span className="text-[10px] text-[var(--text-muted)] -mt-2">{String(h).padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>

          {/* Columnas de días */}
          {dias.map((dia, di) => (
            <div key={di} className="relative border-l border-[var(--border-subtle)]">
              {/* Líneas de hora */}
              {HORAS.map((h) => (
                <div
                  key={h}
                  onClick={() => onHoraClick(dia, h)}
                  className="absolute w-full border-t border-[var(--border-subtle)] hover:bg-[var(--bg-panel-raised)] cursor-pointer transition-colors"
                  style={{ top: h * ALTURA_HORA, height: ALTURA_HORA }}
                />
              ))}

              {/* Eventos con hora */}
              {eventosConHora(dia).map((ev) => {
                const { top, height } = posicionEvento(ev);
                const inicio = new Date(ev.fechaInicio);
                const ffin = ev.fechaFin ? new Date(ev.fechaFin) : new Date(inicio.getTime() + 3600000);
                return (
                  <div
                    key={ev.id}
                    onClick={() => onEventoClick(ev)}
                    className="absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 text-white cursor-pointer hover:opacity-90 overflow-hidden z-10"
                    style={{ top, height, backgroundColor: ev.color }}
                  >
                    <p className="text-[10px] font-semibold truncate">{ev.titulo}</p>
                    {height > 30 && (
                      <p className="text-[9px] opacity-80">{formatHora(inicio)} – {formatHora(ffin)}</p>
                    )}
                  </div>
                );
              })}

              {/* Línea de hora actual */}
              {mismaFecha(dia, hoy) && (() => {
                const ahora = new Date();
                const top = (ahora.getHours() * 60 + ahora.getMinutes()) / 60 * ALTURA_HORA;
                return (
                  <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top }}>
                    <div className="h-0.5 bg-[var(--status-perdido)] relative">
                      <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-[var(--status-perdido)]" />
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
