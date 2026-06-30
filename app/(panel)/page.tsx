"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Paperclip, MessageSquare, ChevronRight } from "lucide-react";
import { EstadoBadge } from "@/components/EstadoBadge";
import { ESTADOS_LIST } from "@/lib/constants";
import toast from "react-hot-toast";

interface Envio {
  id: string;
  numeroSeguimiento: string;
  mensajero: string;
  estado: string;
  motivo: string | null;
  destinatario: string | null;
  ultimaActualizacion: string;
  creadoPor: { nombre: string };
  _count: { adjuntos: number; comentarios: number };
}

export default function EnviosPage() {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const cargarEnvios = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busqueda) params.set("q", busqueda);
      if (filtroEstado) params.set("estado", filtroEstado);
      const res = await fetch(`/api/envios?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setEnvios(data.envios);
      else toast.error(data.error || "Error al cargar los envíos");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [busqueda, filtroEstado]);

  useEffect(() => {
    const timeout = setTimeout(cargarEnvios, 300);
    return () => clearTimeout(timeout);
  }, [cargarEnvios]);

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)]">
            Envíos
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {loading ? "Cargando..." : `${envios.length} envío${envios.length === 1 ? "" : "s"} registrado${envios.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link
          href="/envios/nuevo"
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#1a1408] font-semibold text-sm rounded-md px-4 py-2.5 transition-colors"
        >
          + Registrar envío
        </Link>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nº de seguimiento, destinatario..."
            className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-md pl-9 pr-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-md px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_LIST.map((e) => (
            <option key={e.key} value={e.key}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg overflow-hidden">
        {envios.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <p className="text-[var(--text-secondary)] text-sm">
              No hay envíos que coincidan con la búsqueda.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-left">
                <th className="px-5 py-3 font-medium text-[var(--text-muted)] text-xs uppercase tracking-wider">
                  Nº Seguimiento
                </th>
                <th className="px-5 py-3 font-medium text-[var(--text-muted)] text-xs uppercase tracking-wider">
                  Mensajero
                </th>
                <th className="px-5 py-3 font-medium text-[var(--text-muted)] text-xs uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-5 py-3 font-medium text-[var(--text-muted)] text-xs uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-5 py-3 font-medium text-[var(--text-muted)] text-xs uppercase tracking-wider">
                  Actualizado
                </th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {envios.map((envio) => (
                <tr
                  key={envio.id}
                  className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-panel-raised)] transition-colors cursor-pointer"
                  onClick={() => (window.location.href = `/envios/${envio.id}`)}
                >
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[var(--text-primary)]">
                      {envio.numeroSeguimiento}
                    </span>
                    {envio.destinatario && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {envio.destinatario}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-[var(--text-secondary)]">
                    {envio.mensajero}
                  </td>
                  <td className="px-5 py-3.5">
                    <EstadoBadge estado={envio.estado} />
                  </td>
                  <td className="px-5 py-3.5 text-[var(--text-secondary)] max-w-[220px] truncate">
                    {envio.motivo || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[var(--text-muted)] font-mono text-xs">
                    {new Date(envio.ultimaActualizacion).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 justify-end text-[var(--text-muted)]">
                      {envio._count.adjuntos > 0 && (
                        <span className="flex items-center gap-1 text-xs">
                          <Paperclip size={12} /> {envio._count.adjuntos}
                        </span>
                      )}
                      {envio._count.comentarios > 0 && (
                        <span className="flex items-center gap-1 text-xs">
                          <MessageSquare size={12} /> {envio._count.comentarios}
                        </span>
                      )}
                      <ChevronRight size={16} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
