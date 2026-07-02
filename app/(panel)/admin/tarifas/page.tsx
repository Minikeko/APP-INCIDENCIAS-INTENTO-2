"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { FileSpreadsheet, Upload, Download, Trash2, FileText, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

interface DocumentoTarifa {
  id: string;
  nombreArchivo: string;
  tipoArchivo: string;
  tamano: number;
  mes: number;
  anio: number;
  comercial: string;
  createdAt: string;
  subidoPor: { nombre: string };
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function TarifasPage() {
  const [documentos, setDocumentos] = useState<DocumentoTarifa[]>([]);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hoy = new Date();
  const [form, setForm] = useState({
    mes: String(hoy.getMonth() + 1),
    anio: String(hoy.getFullYear()),
    comercial: "",
  });

  const cargarDocumentos = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/tarifas");
    const data = await res.json();
    if (res.ok) setDocumentos(data.documentos);
    setLoading(false);
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      setLoading(true);
      const res = await fetch("/api/tarifas");
      const data = await res.json();
      if (!activo) return;
      if (res.ok) setDocumentos(data.documentos);
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
      toast.error("Selecciona un archivo");
      return;
    }
    if (!form.comercial.trim()) {
      toast.error("El comercial es obligatorio");
      return;
    }

    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mes", form.mes);
      formData.append("anio", form.anio);
      formData.append("comercial", form.comercial.trim());

      const res = await fetch("/api/tarifas", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al subir el documento");
      } else {
        toast.success("Tarifa subida correctamente");
        setForm({ mes: String(hoy.getMonth() + 1), anio: String(hoy.getFullYear()), comercial: "" });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setMostrarForm(false);
        cargarDocumentos();
      }
    } finally {
      setSubiendo(false);
    }
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este documento?")) return;
    const res = await fetch(`/api/tarifas/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Documento eliminado");
      cargarDocumentos();
    } else {
      toast.error("Error al eliminar");
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet size={20} style={{ color: "var(--accent)" }} />
          <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)]">
            Tarifas de comerciales
          </h1>
        </div>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#1a1408] font-semibold text-sm rounded-md px-4 py-2 transition-colors"
        >
          <Upload size={15} />
          Subir tarifa
        </button>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Documentos de tarifas asociados a cada comercial. Visible solo para administradores.
      </p>

      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5 mb-6 space-y-4"
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Mes
              </label>
              <select
                value={form.mes}
                onChange={(e) => setForm((f) => ({ ...f, mes: e.target.value }))}
                className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
              >
                {MESES.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Año
              </label>
              <input
                type="number"
                value={form.anio}
                onChange={(e) => setForm((f) => ({ ...f, anio: e.target.value }))}
                className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Comercial
              </label>
              <input
                required
                value={form.comercial}
                onChange={(e) => setForm((f) => ({ ...f, comercial: e.target.value }))}
                placeholder="Nombre del comercial"
                className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Archivo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              required
              accept="*/*"
              className="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-[var(--bg-panel-raised)] file:text-[var(--text-primary)] file:text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={subiendo}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-sm rounded-md px-4 py-2 transition-colors"
          >
            {subiendo ? "Subiendo..." : "Subir documento"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Cargando...</p>
      ) : documentos.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-4 py-6 text-center">
          No hay documentos de tarifas todavía.
        </p>
      ) : (
        <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg divide-y divide-[var(--border-subtle)]">
          {documentos.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                {doc.tipoArchivo.startsWith("image/") ? (
                  <ImageIcon size={17} className="text-[var(--text-muted)] shrink-0" />
                ) : (
                  <FileText size={17} className="text-[var(--text-muted)] shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">
                    {doc.comercial} — {MESES[doc.mes - 1]} {doc.anio}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {doc.nombreArchivo} · {formatBytes(doc.tamano)} · subido por {doc.subidoPor.nombre}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={`/api/tarifas/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                >
                  <Download size={16} />
                </a>
                <button
                  onClick={() => handleEliminar(doc.id)}
                  className="text-[var(--text-muted)] hover:text-[var(--status-perdido)] transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
