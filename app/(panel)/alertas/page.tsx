"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, Clock, AlertTriangle } from "lucide-react";
import { EstadoBadge } from "@/components/EstadoBadge";

interface EnvioAlerta {
  id: string;
  numeroSeguimiento: string;
  mensajero: string;
  estado: string;
  ultimaActualizacion: string;
  creadoPor: { nombre: string };
}

export default function AlertasPage() {
  const [sinActualizar, setSinActualizar] = useState<EnvioAlerta[]>([]);
  const [perdidos, setPerdidos] = useState<EnvioAlerta[]>([]);
  const [dias, setDias] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/alertas?dias=${dias}`)
      .then((r) => r.json())
      .then((data) => {
        setSinActualizar(data.sinActualizar || []);
        setPerdidos(data.perdidos || []);
      })
      .finally(() => setLoading(false));
  }, [dias]);

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2.5 mb-1">
        <BellRing size={20} style={{ color: "var(--accent)" }} />
        <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)]">
          Alertas
        </h1>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Envíos que necesitan atención: perdidos o sin actualizar.
      </p>

      {loading ? (
        <p className="text-[var(--text-secondary)] text-sm">Cargando...</p>
      ) : (
        <div className="space-y-8">
          {/* Perdidos */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} style={{ color: "var(--status-perdido)" }} />
              <h2 className="text-sm font-medium text-[var(--text-primary)]">
                Envíos marcados como perdidos
              </h2>
              <span className="text-xs text-[var(--text-muted)]">
                ({perdidos.length})
              </span>
            </div>
            {perdidos.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-4 py-3">
                No hay envíos marcados como perdidos.
              </p>
            ) : (
              <AlertaLista envios={perdidos} />
            )}
          </section>

          {/* Sin actualizar */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={15} style={{ color: "var(--status-retrasado)" }} />
                <h2 className="text-sm font-medium text-[var(--text-primary)]">
                  Sin actualizar en más de {dias} días
                </h2>
                <span className="text-xs text-[var(--text-muted)]">
                  ({sinActualizar.length})
                </span>
              </div>
              <select
                value={dias}
                onChange={(e) => setDias(Number(e.target.value))}
                className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-md px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
              >
                <option value={1}>1 día</option>
                <option value={3}>3 días</option>
                <option value={7}>7 días</option>
                <option value={14}>14 días</option>
              </select>
            </div>
            {sinActualizar.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-4 py-3">
                Todo está al día.
              </p>
            ) : (
              <AlertaLista envios={sinActualizar} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function AlertaLista({ envios }: { envios: EnvioAlerta[] }) {
  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg divide-y divide-[var(--border-subtle)]">
      {envios.map((envio) => (
        <Link
          key={envio.id}
          href={`/envios/${envio.id}`}
          className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-panel-raised)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-[var(--text-primary)]">
              {envio.numeroSeguimiento}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {envio.mensajero}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)] font-mono">
              {new Date(envio.ultimaActualizacion).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
              })}
            </span>
            <EstadoBadge estado={envio.estado} />
          </div>
        </Link>
      ))}
    </div>
  );
}
