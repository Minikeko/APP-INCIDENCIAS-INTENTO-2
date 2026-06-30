"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { FileSpreadsheet, Upload, Download, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

interface ArchivoExcel {
  id: string;
  nombreArchivo: string;
  tamano: number;
  descripcion: string | null;
  createdAt: string;
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ExcelPage() {
  const [archivos, setArchivos] = useState<ArchivoExcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [seleccionado, setSeleccionado] = useState<ArchivoExcel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [descripcion, setDescripcion] = useState("");

  const cargarArchivos = useCallback(async () => {
    const res = await fetch("/api/excel");
    const data = await res.json();
    if (res.ok) setArchivos(data.archivos);
    setLoading(false);
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      const res = await fetch("/api/excel");
      const data = await res.json();
      if (!activo) return;
      if (res.ok) setArchivos(data.archivos);
      setLoading(false);
    })();
    return () => { activo = false; };
  }, []);

  async function handleSubir(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Selecciona un archivo Excel");
      return;
    }
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (descripcion.trim()) formData.append("descripcion", descripcion.trim());

      const res = await fetch("/api/excel", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al subir el archivo");
      } else {
        toast.success("Archivo subido correctamente");
        setDescripcion("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        cargarArchivos();
      }
    } finally {
      setSubiendo(false);
    }
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este archivo?")) return;
    const res = await fetch(`/api/excel/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Archivo eliminado");
      if (seleccionado?.id === id) setSeleccionado(null);
      cargarArchivos();
    } else {
      toast.error("Error al eliminar");
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Panel izquierdo: lista + subida */}
      <div className="w-80 border-r border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-4">
            <FileSpreadsheet size={18} style={{ color: "var(--accent)" }} />
            <h1 className="font-display text-lg uppercase tracking-wide text-[var(--text-primary)]">
              Archivos Excel
            </h1>
          </div>

          {/* Formulario de subida */}
          <form onSubmit={handleSubir} className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              required
              accept=".xlsx,.xls"
              className="w-full text-xs text-[var(--text-secondary)] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-[var(--bg-panel-raised)] file:text-[var(--text-primary)] file:text-xs"
            />
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Nombre o descripción (opcional)"
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors"
            />
            <button
              type="submit"
              disabled={subiendo}
              className="w-full flex items-center justify-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-xs rounded py-2 transition-colors"
            >
              <Upload size={13} />
              {subiendo ? "Subiendo..." : "Subir Excel"}
            </button>
          </form>
        </div>

        {/* Lista de archivos */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-[var(--text-muted)] px-5 py-4">Cargando...</p>
          ) : archivos.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] px-5 py-4 text-center">
              No hay archivos todavía.
            </p>
          ) : (
            archivos.map((a) => (
              <div
                key={a.id}
                onClick={() => setSeleccionado(a)}
                className={`group px-4 py-3 border-b border-[var(--border-subtle)] cursor-pointer transition-colors ${
                  seleccionado?.id === a.id
                    ? "bg-[var(--accent-dim)]"
                    : "hover:bg-[var(--bg-panel-raised)]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--text-primary)] font-medium truncate">
                      {a.descripcion || a.nombreArchivo}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {a.nombreArchivo} · {formatBytes(a.tamano)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(a.createdAt).toLocaleDateString("es-ES")} · {a.subidoPor.nombre}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={`/api/excel/${a.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      <Download size={14} />
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminar(a.id);
                      }}
                      className="text-[var(--text-muted)] hover:text-[var(--status-perdido)] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Panel derecho: vista previa */}
      <div className="flex-1 bg-[var(--bg-base)] flex flex-col">
        {seleccionado ? (
          <VistaPrevia archivo={seleccionado} onCerrar={() => setSeleccionado(null)} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)]">
            <FileSpreadsheet size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Selecciona un archivo para ver su contenido</p>
          </div>
        )}
      </div>
    </div>
  );
}

function VistaPrevia({
  archivo,
  onCerrar,
}: {
  archivo: ArchivoExcel;
  onCerrar: () => void;
}) {
  const [filas, setFilas] = useState<CeldaPreview[][] | null>(null);
  const [anchosColumnas, setAnchosColumnas] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);
  const [totalFilas, setTotalFilas] = useState(0);

  useEffect(() => {
    let activo = true;
    (async () => {
      setCargando(true);
      const res = await fetch(`/api/excel/${archivo.id}/preview`);
      const data = await res.json();
      if (!activo) return;
      if (res.ok) {
        setFilas(data.filas);
        setAnchosColumnas(data.anchosColumnas || []);
        setTotalFilas(data.totalFilas || 0);
      }
      setCargando(false);
    })();
    return () => { activo = false; };
  }, [archivo.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileSpreadsheet size={16} className="text-[var(--text-muted)] shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {archivo.descripcion || archivo.nombreArchivo}
            </p>
            {archivo.descripcion && (
              <p className="text-xs text-[var(--text-muted)] truncate">{archivo.nombreArchivo}</p>
            )}
          </div>
          {totalFilas > 0 && (
            <span className="text-xs text-[var(--text-muted)] shrink-0">
              · {totalFilas} fila(s)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={`/api/excel/${archivo.id}`}
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            <Download size={14} />
            Descargar
          </a>
          <button
            onClick={onCerrar}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabla del Excel */}
      <div className="flex-1 overflow-auto bg-white">
        {cargando ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">Cargando vista previa...</p>
          </div>
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
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">No hay datos para mostrar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
