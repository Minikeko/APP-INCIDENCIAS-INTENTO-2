"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { EstadoBadge } from "@/components/EstadoBadge";

interface Envio {
  id: string;
  numeroSeguimiento: string;
  mensajero: string;
  estado: string;
  destinatario: string | null;
  columnaTablero: "PENDIENTE" | "SE_ACEPTA" | "NO_SE_ACEPTA" | "SOLUCIONADO";
}

interface MenuContextual {
  x: number;
  y: number;
  envioId: string;
  columnaActual: string;
}

const COLUMNAS = [
  {
    key: "PENDIENTE" as const,
    label: "Pendiente",
    color: "var(--status-retrasado)",
    bg: "rgba(251,191,36,0.08)",
  },
  {
    key: "SE_ACEPTA" as const,
    label: "Se acepta",
    color: "var(--status-entregado)",
    bg: "rgba(74,222,128,0.08)",
  },
  {
    key: "NO_SE_ACEPTA" as const,
    label: "No se acepta",
    color: "var(--status-perdido)",
    bg: "rgba(248,113,113,0.08)",
  },
  {
    key: "SOLUCIONADO" as const,
    label: "Solucionado",
    color: "var(--status-resuelto)",
    bg: "rgba(74,222,128,0.08)",
  },
] as const;

export default function TableroPage() {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<MenuContextual | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const cargarEnvios = useCallback(async () => {
    const res = await fetch("/api/envios");
    const data = await res.json();
    if (res.ok) setEnvios(data.envios);
    setLoading(false);
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      const res = await fetch("/api/envios");
      const data = await res.json();
      if (!activo) return;
      if (res.ok) setEnvios(data.envios);
      setLoading(false);
    })();
    return () => { activo = false; };
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    }
    if (menu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menu]);

  function handleContextMenu(e: React.MouseEvent, envio: Envio) {
    e.preventDefault();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      envioId: envio.id,
      columnaActual: envio.columnaTablero,
    });
  }

  async function moverColumna(envioId: string, columna: string) {
    setMenu(null);
    const res = await fetch(`/api/envios/${envioId}/tablero`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columna }),
    });
    if (res.ok) {
      setEnvios((prev) =>
        prev.map((e) =>
          e.id === envioId
            ? { ...e, columnaTablero: columna as Envio["columnaTablero"] }
            : e
        )
      );
    } else {
      toast.error("Error al mover el envío");
      cargarEnvios();
    }
  }

  const enviosPorColumna = (columna: string) =>
    envios.filter((e) => e.columnaTablero === columna);

  if (loading) {
    return <div className="p-8 text-[var(--text-secondary)]">Cargando tablero...</div>;
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)] mb-6">
        Tablero
      </h1>

      <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
        {COLUMNAS.map((col) => {
          const items = enviosPorColumna(col.key);
          return (
            <div
              key={col.key}
              className="flex-1 min-w-[220px] max-w-xs flex flex-col rounded-lg border border-[var(--border-subtle)]"
              style={{ backgroundColor: col.bg }}
            >
              {/* Cabecera de columna */}
              <div
                className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between"
              >
                <span
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: col.color }}
                >
                  {col.label}
                </span>
                <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-panel)] rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              </div>

              {/* Tarjetas de envíos */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {items.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] text-center py-4">
                    Sin envíos
                  </p>
                ) : (
                  items.map((envio) => (
                    <div
                      key={envio.id}
                      onContextMenu={(e) => handleContextMenu(e, envio)}
                      onClick={() => router.push(`/envios/${envio.id}`)}
                      className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-md px-3 py-2.5 cursor-pointer hover:border-[var(--accent)] transition-colors select-none"
                    >
                      <p className="font-mono text-xs text-[var(--text-primary)] font-semibold truncate">
                        {envio.numeroSeguimiento}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        {envio.mensajero}
                        {envio.destinatario && ` · ${envio.destinatario}`}
                      </p>
                      <div className="mt-1.5">
                        <EstadoBadge estado={envio.estado} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Menú contextual */}
      {menu && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg shadow-2xl py-1 min-w-[170px]"
          style={{ top: menu.y, left: menu.x }}
        >
          <p className="px-3 py-1.5 text-xs text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-subtle)] mb-1">
            Mover a
          </p>
          {COLUMNAS.filter((c) => c.key !== menu.columnaActual).map((col) => (
            <button
              key={col.key}
              onClick={() => moverColumna(menu.envioId, col.key)}
              className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-panel-raised)] transition-colors flex items-center gap-2"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: col.color }}
              />
              {col.label}
            </button>
          ))}
          <div className="border-t border-[var(--border-subtle)] mt-1 pt-1">
            <button
              onClick={() => {
                router.push(`/envios/${menu.envioId}`);
                setMenu(null);
              }}
              className="w-full text-left px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-panel-raised)] transition-colors"
            >
              Ver ficha del envío
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
