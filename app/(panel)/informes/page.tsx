"use client";

import { useState } from "react";
import { FileBarChart, Download } from "lucide-react";
import toast from "react-hot-toast";
import { ESTADOS_LIST } from "@/lib/constants";

export default function InformesPage() {
  const [filtros, setFiltros] = useState({
    estado: "",
    mensajero: "",
    desde: "",
    hasta: "",
  });
  const [generando, setGenerando] = useState(false);

  function update(field: string, value: string) {
    setFiltros((f) => ({ ...f, [field]: value }));
  }

  async function handleExportar() {
    setGenerando(true);
    try {
      const params = new URLSearchParams();
      if (filtros.estado) params.set("estado", filtros.estado);
      if (filtros.mensajero) params.set("mensajero", filtros.mensajero);
      if (filtros.desde) params.set("desde", filtros.desde);
      if (filtros.hasta) params.set("hasta", filtros.hasta);

      const res = await fetch(`/api/informes/excel?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al generar el informe");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `informe-envios-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Informe descargado");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-2.5 mb-1">
        <FileBarChart size={20} style={{ color: "var(--accent)" }} />
        <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)]">
          Informes
        </h1>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Exporta un listado de envíos a Excel, con filtros opcionales.
      </p>

      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Estado
            </label>
            <select
              value={filtros.estado}
              onChange={(e) => update("estado", e.target.value)}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
            >
              <option value="">Todos</option>
              {ESTADOS_LIST.map((e) => (
                <option key={e.key} value={e.key}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Mensajero
            </label>
            <input
              value={filtros.mensajero}
              onChange={(e) => update("mensajero", e.target.value)}
              placeholder="Ej. SEUR"
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Desde
            </label>
            <input
              type="date"
              value={filtros.desde}
              onChange={(e) => update("desde", e.target.value)}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Hasta
            </label>
            <input
              type="date"
              value={filtros.hasta}
              onChange={(e) => update("hasta", e.target.value)}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleExportar}
          disabled={generando}
          className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-sm rounded-md px-4 py-2.5 transition-colors"
        >
          <Download size={15} />
          {generando ? "Generando..." : "Descargar Excel"}
        </button>
      </div>
    </div>
  );
}
