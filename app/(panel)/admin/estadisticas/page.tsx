"use client";

import { useEffect, useState } from "react";
import { BarChart3, Package, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { ESTADOS, EstadoKey } from "@/lib/constants";

interface Estadisticas {
  total: number;
  abiertos: number;
  cerrados: number;
  ultimos30dias: number;
  porEstado: { estado: string; cantidad: number }[];
  porMensajero: { mensajero: string; cantidad: number }[];
}

export default function EstadisticasPage() {
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;
    (async () => {
      const res = await fetch("/api/estadisticas");
      const data = await res.json();
      if (activo && res.ok) setStats(data);
      if (activo) setLoading(false);
    })();
    return () => {
      activo = false;
    };
  }, []);

  if (loading) {
    return <div className="p-8 text-[var(--text-secondary)]">Cargando...</div>;
  }

  if (!stats) {
    return <div className="p-8 text-[var(--text-secondary)]">No se pudieron cargar las estadísticas.</div>;
  }

  const maxEstado = Math.max(...stats.porEstado.map((e) => e.cantidad), 1);
  const maxMensajero = Math.max(...stats.porMensajero.map((m) => m.cantidad), 1);

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-2.5 mb-1">
        <BarChart3 size={20} style={{ color: "var(--accent)" }} />
        <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)]">
          Estadísticas
        </h1>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Resumen general de la actividad de envíos.
      </p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Total envíos" value={stats.total} />
        <StatCard icon={AlertCircle} label="Abiertos" value={stats.abiertos} color="var(--status-retrasado)" />
        <StatCard icon={CheckCircle2} label="Cerrados" value={stats.cerrados} color="var(--status-entregado)" />
        <StatCard icon={TrendingUp} label="Últimos 30 días" value={stats.ultimos30dias} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <section className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
            Envíos por estado
          </h2>
          <div className="space-y-3">
            {stats.porEstado.map((e) => {
              const config = ESTADOS[e.estado as EstadoKey];
              return (
                <div key={e.estado}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[var(--text-secondary)]">{config?.label || e.estado}</span>
                    <span className="text-[var(--text-muted)] font-mono">{e.cantidad}</span>
                  </div>
                  <div className="h-1.5 bg-[var(--bg-panel-raised)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(e.cantidad / maxEstado) * 100}%`,
                        backgroundColor: config?.color || "var(--text-muted)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
            Envíos por mensajero
          </h2>
          <div className="space-y-3">
            {stats.porMensajero.map((m) => (
              <div key={m.mensajero}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[var(--text-secondary)]">{m.mensajero}</span>
                  <span className="text-[var(--text-muted)] font-mono">{m.cantidad}</span>
                </div>
                <div className="h-1.5 bg-[var(--bg-panel-raised)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(m.cantidad / maxMensajero) * 100}%`,
                      backgroundColor: "var(--accent)",
                    }}
                  />
                </div>
              </div>
            ))}
            {stats.porMensajero.length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">Sin datos todavía.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-4">
      <Icon size={16} style={{ color: color || "var(--accent)" }} className="mb-2" />
      <p className="font-display text-2xl text-[var(--text-primary)]">{value}</p>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
