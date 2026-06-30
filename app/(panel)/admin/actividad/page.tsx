"use client";

import { useEffect, useState } from "react";
import { History, ChevronLeft, ChevronRight } from "lucide-react";

interface Registro {
  id: string;
  tipo: string;
  descripcion: string;
  createdAt: string;
  usuario: { nombre: string };
}

const TIPO_LABELS: Record<string, string> = {
  LOGIN: "Inicio de sesión",
  ENVIO_CREADO: "Envío creado",
  ENVIO_EDITADO: "Envío editado",
  ENVIO_ELIMINADO: "Envío eliminado",
  ESTADO_CAMBIADO: "Cambio de estado",
  COMENTARIO_ANADIDO: "Comentario añadido",
  ADJUNTO_SUBIDO: "Adjunto subido",
  ADJUNTO_ELIMINADO: "Adjunto eliminado",
  USUARIO_CREADO: "Usuario creado",
  USUARIO_ACTUALIZADO: "Usuario actualizado",
  DOCUMENTO_SUBIDO: "Documento subido",
  DOCUMENTO_ELIMINADO: "Documento eliminado",
};

export default function ActividadPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  useEffect(() => {
    let activo = true;
    (async () => {
      setLoading(true);
      const params = new URLSearchParams({ pagina: String(pagina) });
      if (tipo) params.set("tipo", tipo);
      const res = await fetch(`/api/actividad?${params.toString()}`);
      const data = await res.json();
      if (!activo) return;
      if (res.ok) {
        setRegistros(data.registros);
        setTotalPaginas(data.totalPaginas || 1);
      }
      setLoading(false);
    })();
    return () => {
      activo = false;
    };
  }, [tipo, pagina]);

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-2.5 mb-1">
        <History size={20} style={{ color: "var(--accent)" }} />
        <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)]">
          Registro de actividad
        </h1>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Historial de acciones relevantes realizadas en la aplicación.
      </p>

      <div className="mb-5">
        <select
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value);
            setPagina(1);
          }}
          className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
        >
          <option value="">Todas las acciones</option>
          {Object.entries(TIPO_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Cargando...</p>
      ) : registros.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-4 py-6 text-center">
          No hay actividad registrada todavía.
        </p>
      ) : (
        <>
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg divide-y divide-[var(--border-subtle)]">
            {registros.map((r) => (
              <div key={r.id} className="px-5 py-3.5">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ color: "var(--accent)", backgroundColor: "var(--accent-dim)" }}
                  >
                    {TIPO_LABELS[r.tipo] || r.tipo}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    {new Date(r.createdAt).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-primary)]">{r.descripcion}</p>
              </div>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs text-[var(--text-muted)]">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
