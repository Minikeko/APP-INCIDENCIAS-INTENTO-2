"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Volume2, VolumeX } from "lucide-react";
import toast from "react-hot-toast";

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string;
  leida: boolean;
  url: string | null;
  createdAt: string;
}

const TIPOS_NOTIFICACION = [
  { key: "MENSAJE_NUEVO", label: "Mensajes nuevos en chat" },
  { key: "MENCION", label: "Menciones con @" },
  { key: "ESTADO_ENVIO_CAMBIADO", label: "Cambios de estado en envíos" },
  { key: "ENVIO_ASIGNADO", label: "Envíos asignados a mí" },
  { key: "EVENTO_RECORDATORIO", label: "Eventos del calendario" },
];

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [silenciados, setSilenciados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;
    (async () => {
      const [notifRes, prefRes] = await Promise.all([
        fetch("/api/notificaciones"),
        fetch("/api/preferencias"),
      ]);
      const notifData = await notifRes.json();
      const prefData = await prefRes.json();
      if (!activo) return;
      if (notifRes.ok) setNotificaciones(notifData.notificaciones);
      if (prefRes.ok) setSilenciados(prefData.notificacionesSilenciadas || []);
      setLoading(false);
    })();
    return () => { activo = false; };
  }, []);

  async function marcarTodasLeidas() {
    await fetch("/api/notificaciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  }

  async function toggleSilenciar(tipo: string) {
    const nuevos = silenciados.includes(tipo)
      ? silenciados.filter((t) => t !== tipo)
      : [...silenciados, tipo];
    setSilenciados(nuevos);
    const res = await fetch("/api/preferencias", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificacionesSilenciadas: nuevos }),
    });
    if (res.ok) {
      toast.success(silenciados.includes(tipo) ? "Notificaciones activadas" : "Notificaciones silenciadas");
    }
  }

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-2.5 mb-1">
        <Bell size={20} style={{ color: "var(--accent)" }} />
        <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)]">
          Notificaciones
        </h1>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        {noLeidas > 0 ? `${noLeidas} sin leer` : "Todo al día"}
      </p>

      {/* Preferencias de silencio */}
      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-4 mb-6">
        <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Silenciar tipos de notificación
        </p>
        <div className="space-y-2">
          {TIPOS_NOTIFICACION.map((tipo) => {
            const silenciado = silenciados.includes(tipo.key);
            return (
              <div key={tipo.key} className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-primary)]">{tipo.label}</span>
                <button
                  onClick={() => toggleSilenciar(tipo.key)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors ${
                    silenciado
                      ? "bg-[var(--bg-panel-raised)] text-[var(--text-muted)]"
                      : "bg-[var(--accent-dim)] text-[var(--accent)]"
                  }`}
                >
                  {silenciado ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  {silenciado ? "Silenciado" : "Activo"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-[var(--text-primary)]">Historial</p>
        {noLeidas > 0 && (
          <button
            onClick={marcarTodasLeidas}
            className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
          >
            <Check size={12} />
            Marcar todas leídas
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Cargando...</p>
      ) : notificaciones.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-4 py-6 text-center">
          No hay notificaciones todavía.
        </p>
      ) : (
        <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg divide-y divide-[var(--border-subtle)]">
          {notificaciones.map((n) => (
            <a
              key={n.id}
              href={n.url || "#"}
              className={`block px-4 py-3 transition-colors hover:bg-[var(--bg-panel-raised)] ${
                !n.leida ? "bg-[var(--accent-dim)]" : ""
              }`}
            >
              <p className="text-sm font-medium text-[var(--text-primary)]">{n.titulo}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{n.cuerpo}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                {new Date(n.createdAt).toLocaleString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
