"use client";

import { useState } from "react";
import { X, Trash2, Users } from "lucide-react";
import { Evento, COLORES } from "./tipos";

interface Usuario { id: string; nombre: string; activo: boolean; }

interface ModalEventoProps {
  evento?: Evento | null;
  fechaInicial?: string;
  usuarios: Usuario[];
  miId: string;
  onGuardar: (datos: DatosEvento) => Promise<void>;
  onEliminar?: (id: string) => Promise<void>;
  onCerrar: () => void;
  guardando: boolean;
}

export interface DatosEvento {
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  todoElDia: boolean;
  color: string;
  participantesIds: string[];
}

export function ModalEvento({ evento, fechaInicial, usuarios, miId, onGuardar, onEliminar, onCerrar, guardando }: ModalEventoProps) {
  const esEdicion = !!evento;

  const [form, setForm] = useState<DatosEvento>({
    titulo: evento?.titulo ?? "",
    descripcion: evento?.descripcion ?? "",
    fechaInicio: evento?.fechaInicio
      ? new Date(evento.fechaInicio).toISOString().slice(0, 16)
      : fechaInicial ?? new Date().toISOString().slice(0, 16),
    fechaFin: evento?.fechaFin
      ? new Date(evento.fechaFin).toISOString().slice(0, 16)
      : fechaInicial
        ? (() => { const d = new Date(fechaInicial); d.setHours(d.getHours() + 1); return d.toISOString().slice(0, 16); })()
        : "",
    todoElDia: evento?.todoElDia ?? false,
    color: evento?.color ?? COLORES[0],
    participantesIds: evento?.participantes.map((p) => p.user.id) ?? [],
  });

  function toggleParticipante(id: string) {
    setForm((f) => ({
      ...f,
      participantesIds: f.participantesIds.includes(id)
        ? f.participantesIds.filter((i) => i !== id)
        : [...f.participantesIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onGuardar(form);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl w-full max-w-md shadow-2xl">
        {/* Franja de color superior */}
        <div className="h-1.5 rounded-t-xl" style={{ backgroundColor: form.color }} />

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg uppercase tracking-wide text-[var(--text-primary)]">
              {esEdicion ? "Editar evento" : "Nuevo evento"}
            </h2>
            <button onClick={onCerrar} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Título */}
            <input
              required
              autoFocus
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Título del evento"
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors font-medium"
            />

            {/* Todo el día */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.todoElDia}
                onChange={(e) => setForm((f) => ({ ...f, todoElDia: e.target.checked }))}
                className="accent-[var(--accent)] w-4 h-4"
              />
              <span className="text-sm text-[var(--text-secondary)]">Todo el día</span>
            </label>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Inicio</label>
                <input
                  required
                  type={form.todoElDia ? "date" : "datetime-local"}
                  value={form.todoElDia ? form.fechaInicio.slice(0, 10) : form.fechaInicio}
                  onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))}
                  className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Fin</label>
                <input
                  type={form.todoElDia ? "date" : "datetime-local"}
                  value={form.todoElDia ? (form.fechaFin?.slice(0, 10) ?? "") : (form.fechaFin ?? "")}
                  onChange={(e) => setForm((f) => ({ ...f, fechaFin: e.target.value }))}
                  className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            {/* Descripción */}
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              placeholder="Añadir descripción..."
              rows={2}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:border-[var(--accent)] transition-colors"
            />

            {/* Color */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-2">Color</label>
              <div className="flex gap-2">
                {COLORES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{ backgroundColor: c, borderColor: form.color === c ? "white" : "transparent", transform: form.color === c ? "scale(1.2)" : "scale(1)" }}
                  />
                ))}
              </div>
            </div>

            {/* Participantes */}
            {usuarios.filter((u) => u.id !== miId).length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Users size={13} className="text-[var(--text-muted)]" />
                  <label className="text-xs text-[var(--text-muted)]">Participantes</label>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 border border-[var(--border-subtle)] rounded-lg p-2">
                  {usuarios.filter((u) => u.id !== miId && u.activo).map((u) => (
                    <label key={u.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-[var(--bg-panel-raised)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.participantesIds.includes(u.id)}
                        onChange={() => toggleParticipante(u.id)}
                        className="accent-[var(--accent)]"
                      />
                      <span className="text-xs text-[var(--text-primary)]">{u.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-sm rounded-lg py-2.5 transition-colors"
              >
                {guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear evento"}
              </button>
              {esEdicion && onEliminar && evento && (
                <button
                  type="button"
                  onClick={() => onEliminar(evento.id)}
                  className="p-2.5 text-[var(--text-muted)] hover:text-[var(--status-perdido)] hover:bg-[var(--bg-panel-raised)] rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
