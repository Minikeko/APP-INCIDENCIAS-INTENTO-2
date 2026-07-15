"use client";

import { X, Pencil, Trash2, Users, Clock, AlignLeft } from "lucide-react";
import { Evento, formatHora, MESES } from "./tipos";

interface DetalleEventoProps {
  evento: Evento;
  miId: string;
  onCerrar: () => void;
  onEditar: () => void;
  onEliminar: (id: string) => void;
}

export function DetalleEvento({ evento, miId, onCerrar, onEditar, onEliminar }: DetalleEventoProps) {
  const inicio = new Date(evento.fechaInicio);
  const fin = evento.fechaFin ? new Date(evento.fechaFin) : null;

  const esMultidia = fin && inicio.toDateString() !== fin.toDateString();
  const puedeEditar = evento.creadoPor.id === miId;

  function formatFecha(d: Date) {
    return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
  }

  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-lg">
      {/* Franja de color */}
      <div className="h-1.5" style={{ backgroundColor: evento.color }} />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-tight flex-1 pr-2">{evento.titulo}</h3>
          <div className="flex items-center gap-1 shrink-0">
            {puedeEditar && (
              <button onClick={onEditar} className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors rounded"><Pencil size={14} /></button>
            )}
            {puedeEditar && (
              <button onClick={() => onEliminar(evento.id)} className="p-1 text-[var(--text-muted)] hover:text-[var(--status-perdido)] transition-colors rounded"><Trash2 size={14} /></button>
            )}
            <button onClick={onCerrar} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded"><X size={14} /></button>
          </div>
        </div>

        <div className="space-y-2.5">
          {/* Fecha y hora */}
          <div className="flex items-start gap-2">
            <Clock size={13} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
            <div className="text-xs text-[var(--text-secondary)]">
              {evento.todoElDia ? (
                esMultidia
                  ? <span>{formatFecha(inicio)} – {formatFecha(fin!)}</span>
                  : <span>{formatFecha(inicio)} · Todo el día</span>
              ) : (
                esMultidia ? (
                  <span>{formatFecha(inicio)} {formatHora(inicio)} – {formatFecha(fin!)} {formatHora(fin!)}</span>
                ) : (
                  <span>{formatFecha(inicio)}, {formatHora(inicio)}{fin ? ` – ${formatHora(fin)}` : ""}</span>
                )
              )}
            </div>
          </div>

          {/* Descripción */}
          {evento.descripcion && (
            <div className="flex items-start gap-2">
              <AlignLeft size={13} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{evento.descripcion}</p>
            </div>
          )}

          {/* Creador */}
          <div className="flex items-start gap-2">
            <Users size={13} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
            <div className="text-xs text-[var(--text-secondary)]">
              <span className="text-[var(--text-muted)]">Creado por </span>
              <span className="font-medium">{evento.creadoPor.nombre}</span>
              {evento.participantes.length > 0 && (
                <>
                  <span className="text-[var(--text-muted)]"> · Participantes: </span>
                  <span>{evento.participantes.map((p) => p.user.nombre).join(", ")}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
