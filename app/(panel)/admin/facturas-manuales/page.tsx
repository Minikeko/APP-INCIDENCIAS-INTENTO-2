"use client";

import { useEffect, useState, useCallback } from "react";
import { Receipt, Plus, Trash2, Download, X, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface LineaForm {
  descripcion: string;
  cantidad: string;
  precioUnit: string;
}

interface LineaFactura {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnit: number;
  total: number;
}

interface FacturaManual {
  id: string;
  numeroFactura: string;
  fechaEmision: string;
  fechaVencimiento: string | null;
  clienteNombre: string;
  clienteNif: string | null;
  albaranes: string | null;
  baseImponible: number;
  tipoIva: number;
  totalIva: number;
  total: number;
  lineas: LineaFactura[];
  creadoPor: { nombre: string };
}

const LINEA_VACIA: LineaForm = { descripcion: "", cantidad: "1", precioUnit: "" };

export default function FacturasManualPage() {
  const [facturas, setFacturas] = useState<FacturaManual[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [previsualizando, setPrevisualizando] = useState<FacturaManual | null>(null);

  const [form, setForm] = useState({
    numeroFactura: "",
    fechaEmision: new Date().toISOString().slice(0, 10),
    fechaVencimiento: "",
    clienteNombre: "",
    clienteNif: "",
    clienteDireccion: "",
    clienteEmail: "",
    albaranes: "",
    observaciones: "",
    tipoIva: "21",
  });
  const [lineas, setLineas] = useState<LineaForm[]>([{ ...LINEA_VACIA }]);

  const cargarFacturas = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/facturas-manuales");
    const data = await res.json();
    if (res.ok) setFacturas(data.facturas);
    setLoading(false);
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      const res = await fetch("/api/facturas-manuales");
      const data = await res.json();
      if (!activo) return;
      if (res.ok) setFacturas(data.facturas);
      setLoading(false);
    })();
    return () => { activo = false; };
  }, []);

  function addLinea() { setLineas((p) => [...p, { ...LINEA_VACIA }]); }
  function removeLinea(i: number) { setLineas((p) => p.filter((_, j) => j !== i)); }
  function updateLinea(i: number, campo: keyof LineaForm, valor: string) {
    setLineas((p) => p.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)));
  }

  const baseCalc = lineas.reduce((s, l) => {
    const n = parseFloat(l.cantidad || "0") * parseFloat(l.precioUnit || "0");
    return s + (isNaN(n) ? 0 : n);
  }, 0);
  const ivaCalc = (baseCalc * parseInt(form.tipoIva || "21")) / 100;
  const totalCalc = baseCalc + ivaCalc;

  function fmt(n: number) {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lineasValidas = lineas.filter((l) => l.descripcion && l.precioUnit);
    if (!lineasValidas.length) { toast.error("Añade al menos una línea de concepto"); return; }
    setGuardando(true);
    try {
      const res = await fetch("/api/facturas-manuales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tipoIva: parseInt(form.tipoIva),
          lineas: lineasValidas.map((l) => ({
            descripcion: l.descripcion,
            cantidad: parseFloat(l.cantidad || "1"),
            precioUnit: parseFloat(l.precioUnit),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error al crear la factura"); return; }
      toast.success("Factura creada");
      setMostrarForm(false);
      setLineas([{ ...LINEA_VACIA }]);
      setForm({ numeroFactura: "", fechaEmision: new Date().toISOString().slice(0, 10), fechaVencimiento: "", clienteNombre: "", clienteNif: "", clienteDireccion: "", clienteEmail: "", albaranes: "", observaciones: "", tipoIva: "21" });
      cargarFacturas();
    } finally { setGuardando(false); }
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar esta factura?")) return;
    const res = await fetch(`/api/facturas-manuales/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Factura eliminada"); if (previsualizando?.id === id) setPrevisualizando(null); cargarFacturas(); }
    else toast.error("Error al eliminar");
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <Receipt size={20} style={{ color: "var(--accent)" }} />
          <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)]">Facturas</h1>
        </div>
        <button onClick={() => setMostrarForm((v) => !v)} className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#1a1408] font-semibold text-sm rounded-md px-4 py-2 transition-colors">
          <Plus size={15} /> Nueva factura
        </button>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">{loading ? "Cargando..." : `${facturas.length} factura(s) · Total: ${fmt(facturas.reduce((s, f) => s + f.total, 0))}`}</p>

      {mostrarForm && (
        <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5 mb-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[["Nº Factura", "numeroFactura"], ["Fecha emisión", "fechaEmision"], ["Fecha vencimiento", "fechaVencimiento"]].map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">{label}</label>
                <input type={key.includes("fecha") || key.includes("Fecha") ? "date" : "text"} value={(form as Record<string, string>)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} required={key === "numeroFactura" || key === "fechaEmision"} className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[["Cliente / Empresa", "clienteNombre"], ["NIF / CIF", "clienteNif"], ["Dirección", "clienteDireccion"], ["Email cliente", "clienteEmail"]].map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">{label}</label>
                <input value={(form as Record<string, string>)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} required={key === "clienteNombre"} className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Nº Albaranes</label>
              <input value={form.albaranes} onChange={(e) => setForm((f) => ({ ...f, albaranes: e.target.value }))} placeholder="Ej: 001, 002, 003" className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">IVA (%)</label>
              <select value={form.tipoIva} onChange={(e) => setForm((f) => ({ ...f, tipoIva: e.target.value }))} className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors">
                {[0, 4, 10, 21].map((v) => <option key={v} value={v}>{v}%</option>)}
              </select>
            </div>
          </div>

          {/* Líneas de concepto */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Líneas de concepto</label>
              <button type="button" onClick={addLinea} className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"><Plus size={12} /> Añadir línea</button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-1">
                {["Descripción", "Cantidad", "Precio unit.", "Total"].map((h) => (
                  <span key={h} className={`text-[10px] uppercase tracking-wider text-[var(--text-muted)] ${h === "Descripción" ? "col-span-6" : "col-span-2"}`}>{h}</span>
                ))}
              </div>
              {lineas.map((l, i) => {
                const tot = (parseFloat(l.cantidad || "0") * parseFloat(l.precioUnit || "0")) || 0;
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input value={l.descripcion} onChange={(e) => updateLinea(i, "descripcion", e.target.value)} placeholder="Descripción del servicio" className="col-span-6 bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors" />
                    <input value={l.cantidad} onChange={(e) => updateLinea(i, "cantidad", e.target.value)} type="number" min="0" step="0.01" className="col-span-2 bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors" />
                    <input value={l.precioUnit} onChange={(e) => updateLinea(i, "precioUnit", e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" className="col-span-2 bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors" />
                    <span className="col-span-1 text-sm font-mono text-[var(--text-secondary)]">{fmt(tot)}</span>
                    <button type="button" onClick={() => removeLinea(i)} disabled={lineas.length === 1} className="col-span-1 text-[var(--text-muted)] hover:text-[var(--status-perdido)] disabled:opacity-30 transition-colors"><Trash2 size={14} /></button>
                  </div>
                );
              })}
            </div>

            {/* Totales en tiempo real */}
            <div className="mt-3 border-t border-[var(--border-subtle)] pt-3 flex flex-col items-end gap-1 text-sm">
              <div className="flex gap-8 text-[var(--text-muted)]"><span>Base imponible</span><span className="font-mono">{fmt(baseCalc)}</span></div>
              <div className="flex gap-8 text-[var(--text-muted)]"><span>IVA ({form.tipoIva}%)</span><span className="font-mono">{fmt(ivaCalc)}</span></div>
              <div className="flex gap-8 text-[var(--text-primary)] font-semibold"><span>TOTAL</span><span className="font-mono">{fmt(totalCalc)}</span></div>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Observaciones</label>
            <textarea value={form.observaciones} onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))} className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] min-h-[70px] resize-y focus:border-[var(--accent)] transition-colors" />
          </div>

          <div className="flex gap-3">
            <button onClick={(e) => { e.preventDefault(); handleSubmit(e); }} disabled={guardando} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-sm rounded-md px-4 py-2 transition-colors">{guardando ? "Guardando..." : "Crear factura"}</button>
            <button onClick={() => setMostrarForm(false)} className="text-sm text-[var(--text-secondary)] px-4 py-2 hover:text-[var(--text-primary)] transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          {loading ? <p className="text-sm text-[var(--text-secondary)]">Cargando...</p> : facturas.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-4 py-6 text-center">No hay facturas todavía.</p>
          ) : (
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg divide-y divide-[var(--border-subtle)]">
              {facturas.map((f) => (
                <button key={f.id} onClick={() => setPrevisualizando(f)} className={`w-full text-left flex items-center justify-between px-5 py-3.5 transition-colors ${previsualizando?.id === f.id ? "bg-[var(--accent-dim)]" : "hover:bg-[var(--bg-panel-raised)]"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={17} className="text-[var(--text-muted)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--text-primary)] font-mono font-medium">{f.numeroFactura}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{f.clienteNombre} · {new Date(f.fechaEmision).toLocaleDateString("es-ES")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-mono text-[var(--text-primary)]">{fmt(f.total)}</span>
                    <a href={`/api/facturas-manuales/${f.id}/pdf`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"><Download size={15} /></a>
                    <span onClick={(e) => { e.stopPropagation(); handleEliminar(f.id); }} className="text-[var(--text-muted)] hover:text-[var(--status-perdido)] transition-colors cursor-pointer"><Trash2 size={15} /></span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vista previa de factura */}
        <div className="col-span-1">
          {previsualizando ? (
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-4 sticky top-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{previsualizando.numeroFactura}</span>
                <button onClick={() => setPrevisualizando(null)}><X size={14} className="text-[var(--text-muted)]" /></button>
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{previsualizando.clienteNombre}</p>
              {previsualizando.clienteNif && <p className="text-xs text-[var(--text-muted)]">NIF: {previsualizando.clienteNif}</p>}
              {previsualizando.albaranes && <p className="text-xs text-[var(--text-muted)] mt-1">Albaranes: {previsualizando.albaranes}</p>}
              <div className="mt-3 space-y-1">
                {previsualizando.lineas.map((l) => (
                  <div key={l.id} className="flex justify-between text-xs text-[var(--text-secondary)]">
                    <span className="truncate mr-2">{l.descripcion}</span>
                    <span className="font-mono shrink-0">{fmt(l.total)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-1">
                <div className="flex justify-between text-xs text-[var(--text-muted)]"><span>Base</span><span className="font-mono">{fmt(previsualizando.baseImponible)}</span></div>
                <div className="flex justify-between text-xs text-[var(--text-muted)]"><span>IVA {previsualizando.tipoIva}%</span><span className="font-mono">{fmt(previsualizando.totalIva)}</span></div>
                <div className="flex justify-between text-sm font-semibold text-[var(--text-primary)]"><span>Total</span><span className="font-mono">{fmt(previsualizando.total)}</span></div>
              </div>
              <a href={`/api/facturas-manuales/${previsualizando.id}/pdf`} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-1.5 w-full text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#1a1408] font-semibold rounded-md py-2 transition-colors">
                <Download size={14} /> Descargar PDF
              </a>
            </div>
          ) : (
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-6 text-center sticky top-8">
              <FileText size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
              <p className="text-xs text-[var(--text-muted)]">Selecciona una factura para ver el resumen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
