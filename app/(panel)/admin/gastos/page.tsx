"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Wallet, Plus, Download, Trash2, X, FileText, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import { CATEGORIAS_GASTO, CATEGORIAS_GASTO_LIST, CategoriaGastoKey } from "@/lib/constants";

interface Gasto {
  id: string;
  nombreArchivo: string;
  tipoArchivo: string;
  fecha: string;
  importe: number;
  categoria: CategoriaGastoKey;
  descripcion: string | null;
  subidoPor: { nombre: string };
}

interface CeldaPreview {
  valor: string;
  negrita: boolean;
  cursiva: boolean;
  colorTexto: string | null;
  colorFondo: string | null;
  alineacion: "left" | "center" | "right" | null;
}

const TIPOS_EXCEL = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

function esExcel(tipoArchivo: string) {
  return TIPOS_EXCEL.includes(tipoArchivo);
}

function formatEuros(importe: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(importe);
}

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [previsualizando, setPrevisualizando] = useState<Gasto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    importe: "",
    categoria: "OTROS" as CategoriaGastoKey,
    descripcion: "",
  });

  const cargarGastos = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/gastos");
    const data = await res.json();
    if (res.ok) setGastos(data.gastos);
    setLoading(false);
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      setLoading(true);
      const res = await fetch("/api/gastos");
      const data = await res.json();
      if (!activo) return;
      if (res.ok) setGastos(data.gastos);
      setLoading(false);
    })();
    return () => {
      activo = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Selecciona un archivo PDF o Excel");
      return;
    }
    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fecha", form.fecha);
      formData.append("importe", form.importe);
      formData.append("categoria", form.categoria);
      if (form.descripcion.trim()) formData.append("descripcion", form.descripcion.trim());

      const res = await fetch("/api/gastos", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al subir el gasto");
      } else {
        toast.success("Gasto registrado");
        setForm({
          fecha: new Date().toISOString().slice(0, 10),
          importe: "",
          categoria: "OTROS",
          descripcion: "",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setMostrarForm(false);
        cargarGastos();
      }
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este gasto?")) return;
    const res = await fetch(`/api/gastos/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Gasto eliminado");
      if (previsualizando?.id === id) setPrevisualizando(null);
      cargarGastos();
    } else {
      toast.error("Error al eliminar");
    }
  }

  const totalImporte = gastos.reduce((sum, g) => sum + g.importe, 0);

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <Wallet size={20} style={{ color: "var(--accent)" }} />
          <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)]">
            Gastos varios
          </h1>
        </div>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#1a1408] font-semibold text-sm rounded-md px-4 py-2 transition-colors"
        >
          <Plus size={15} />
          Subir gasto
        </button>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        {loading
          ? "Cargando..."
          : `${gastos.length} gasto(s) registrado(s) · Total: ${formatEuros(totalImporte)}`}
      </p>

      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5 mb-6 space-y-4"
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Importe €
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.importe}
                onChange={(e) => setForm((f) => ({ ...f, importe: e.target.value }))}
                className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Categoría
              </label>
              <select
                value={form.categoria}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoria: e.target.value as CategoriaGastoKey }))
                }
                className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
              >
                {CATEGORIAS_GASTO_LIST.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Descripción (opcional)
            </label>
            <input
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Archivo (PDF o Excel)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              required
              accept="application/pdf,.xlsx,.xls"
              className="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-[var(--bg-panel-raised)] file:text-[var(--text-primary)] file:text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-sm rounded-md px-4 py-2 transition-colors"
          >
            {guardando ? "Subiendo..." : "Registrar gasto"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          {loading ? (
            <p className="text-sm text-[var(--text-secondary)]">Cargando...</p>
          ) : gastos.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-4 py-6 text-center">
              No hay gastos registrados todavía.
            </p>
          ) : (
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg divide-y divide-[var(--border-subtle)]">
              {gastos.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setPrevisualizando(g)}
                  className={`w-full text-left flex items-center justify-between px-5 py-3.5 transition-colors ${
                    previsualizando?.id === g.id
                      ? "bg-[var(--accent-dim)]"
                      : "hover:bg-[var(--bg-panel-raised)]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {esExcel(g.tipoArchivo) ? (
                      <FileSpreadsheet size={17} className="text-[var(--text-muted)] shrink-0" />
                    ) : (
                      <FileText size={17} className="text-[var(--text-muted)] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--text-primary)] truncate">
                        {CATEGORIAS_GASTO[g.categoria]}
                        {g.descripcion && ` — ${g.descripcion}`}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {new Date(g.fecha).toLocaleDateString("es-ES")} · {g.subidoPor.nombre}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-mono text-[var(--text-primary)]">
                      {formatEuros(g.importe)}
                    </span>
                    <a
                      href={`/api/gastos/${g.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      <Download size={15} />
                    </a>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminar(g.id);
                      }}
                      className="text-[var(--text-muted)] hover:text-[var(--status-perdido)] transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vista previa */}
        <div className="col-span-1">
          {previsualizando ? (
            <VistaPrevia gasto={previsualizando} onCerrar={() => setPrevisualizando(null)} />
          ) : (
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-6 text-center sticky top-8">
              <FileText size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
              <p className="text-xs text-[var(--text-muted)]">
                Selecciona un gasto para ver su vista previa
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VistaPrevia({ gasto, onCerrar }: { gasto: Gasto; onCerrar: () => void }) {
  const [filas, setFilas] = useState<CeldaPreview[][] | null>(null);
  const [anchosColumnas, setAnchosColumnas] = useState<number[]>([]);
  const [cargandoPreview, setCargandoPreview] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      if (!esExcel(gasto.tipoArchivo)) {
        if (activo) setFilas(null);
        return;
      }
      setCargandoPreview(true);
      const res = await fetch(`/api/gastos/${gasto.id}/preview`);
      const data = await res.json();
      if (!activo) return;
      if (res.ok) {
        setFilas(data.filas);
        setAnchosColumnas(data.anchosColumnas || []);
      }
      setCargandoPreview(false);
    })();
    return () => {
      activo = false;
    };
  }, [gasto.id, gasto.tipoArchivo]);

  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg overflow-hidden sticky top-8">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)]">
        <span className="text-xs text-[var(--text-muted)] truncate">{gasto.nombreArchivo}</span>
        <button onClick={onCerrar}>
          <X size={14} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
        </button>
      </div>

      {esExcel(gasto.tipoArchivo) ? (
        <div className="max-h-[500px] overflow-auto bg-white">
          {cargandoPreview ? (
            <p className="text-xs text-gray-500 p-3">Cargando vista previa...</p>
          ) : filas && filas.length > 0 ? (
            <table className="border-collapse" style={{ tableLayout: "fixed" }}>
              <colgroup>
                {anchosColumnas.map((ancho, i) => (
                  <col key={i} style={{ width: `${ancho}px` }} />
                ))}
              </colgroup>
              <tbody>
                {filas.map((fila, i) => (
                  <tr key={i}>
                    {fila.map((celda, j) => (
                      <td
                        key={j}
                        className="border border-gray-200 px-1.5 py-1 text-xs overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{
                          fontWeight: celda.negrita ? 700 : 400,
                          fontStyle: celda.cursiva ? "italic" : "normal",
                          color: celda.colorTexto || "#111827",
                          backgroundColor: celda.colorFondo || undefined,
                          textAlign: celda.alineacion || "left",
                        }}
                      >
                        {celda.valor}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-gray-500 p-3">Sin datos para mostrar.</p>
          )}
        </div>
      ) : (
        <iframe
          src={`/api/gastos/${gasto.id}`}
          className="w-full h-[500px] bg-white"
          title="Vista previa del gasto"
        />
      )}
    </div>
  );
}
