"use client";

import { Evento, DIAS_SEMANA_CORTO, MESES, eventoEnDia, eventoEmpiezaEnDia, eventoTerminaEnDia, mismaFecha } from "./tipos";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface VistaMesProps {
  anio: number;
  mes: number;
  eventos: Evento[];
  onCambiarMes: (delta: number) => void;
  onDiaClick: (fecha: Date) => void;
  onEventoClick: (ev: Evento) => void;
  onCambiarVista: (vista: "semana" | "dia", fecha: Date) => void;
}

function diasDelMes(anio: number, mes: number): (Date | null)[] {
  const primerDia = new Date(anio, mes, 1).getDay();
  const offset = primerDia === 0 ? 6 : primerDia - 1;
  const total = new Date(anio, mes + 1, 0).getDate();
  const celdas: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= total; d++) {
    celdas.push(new Date(anio, mes, d));
  }
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

export function VistaMes({ anio, mes, eventos, onCambiarMes, onDiaClick, onEventoClick, onCambiarVista }: VistaMesProps) {
  const hoy = new Date();
  const celdas = diasDelMes(anio, mes);
  const semanas: (Date | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) {
    semanas.push(celdas.slice(i, i + 7));
  }

  function eventosParaDia(fecha: Date): Evento[] {
    return eventos.filter((ev) => eventoEnDia(ev, fecha));
  }

  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg overflow-hidden flex flex-col h-full">
      {/* Cabecera */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)] shrink-0">
        <button onClick={() => onCambiarMes(-1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"><ChevronLeft size={18} /></button>
        <button onClick={() => onCambiarVista("semana", new Date(anio, mes, 1))} className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">{MESES[mes]} {anio}</button>
        <button onClick={() => onCambiarMes(1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"><ChevronRight size={18} /></button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] shrink-0">
        {DIAS_SEMANA_CORTO.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{d}</div>
        ))}
      </div>

      {/* Semanas */}
      <div className="flex-1 flex flex-col">
        {semanas.map((semana, si) => (
          <div key={si} className="flex-1 grid grid-cols-7 border-b border-[var(--border-subtle)] last:border-0 min-h-[80px]">
            {semana.map((fecha, di) => {
              const esHoy = fecha ? mismaFecha(fecha, hoy) : false;
              const evsDia = fecha ? eventosParaDia(fecha) : [];

              return (
                <div
                  key={di}
                  onClick={() => fecha && onDiaClick(fecha)}
                  className={`relative border-r border-[var(--border-subtle)] last:border-r-0 p-1 cursor-pointer hover:bg-[var(--bg-panel-raised)] transition-colors ${!fecha ? "opacity-0 pointer-events-none" : ""}`}
                >
                  {fecha && (
                    <>
                      <div
                        onClick={(e) => { e.stopPropagation(); onCambiarVista("dia", fecha); }}
                        className={`text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full mb-1 cursor-pointer hover:opacity-80 ${esHoy ? "bg-[var(--accent)] text-[#1a1408] font-bold" : "text-[var(--text-secondary)]"}`}
                      >
                        {fecha.getDate()}
                      </div>

                      {/* Eventos del día */}
                      <div className="space-y-0.5">
                        {evsDia.slice(0, 3).map((ev) => {
                          const empieza = eventoEmpiezaEnDia(ev, fecha);
                          const termina = eventoTerminaEnDia(ev, fecha);
                          const esMultidia = ev.fechaFin && new Date(ev.fechaFin).toDateString() !== new Date(ev.fechaInicio).toDateString();

                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => { e.stopPropagation(); onEventoClick(ev); }}
                              className={`text-[10px] px-1 py-0.5 text-white cursor-pointer hover:opacity-80 transition-opacity leading-tight ${esMultidia ? (empieza ? "rounded-l-sm" : termina ? "rounded-r-sm" : "") : "rounded-sm"}`}
                              style={{
                                backgroundColor: ev.color,
                                marginLeft: esMultidia && !empieza ? "-4px" : undefined,
                                marginRight: esMultidia && !termina ? "-4px" : undefined,
                              }}
                            >
                              {empieza ? ev.titulo : ""}
                            </div>
                          );
                        })}
                        {evsDia.length > 3 && (
                          <div className="text-[9px] text-[var(--text-muted)] pl-1">+{evsDia.length - 3} más</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
