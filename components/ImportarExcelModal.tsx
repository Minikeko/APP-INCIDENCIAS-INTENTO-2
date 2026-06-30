"use client";

import { useState, useRef } from "react";
import { X, FileSpreadsheet, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

interface ImportarExcelModalProps {
  onClose: () => void;
  onImportado: () => void;
}

type Paso = "subir" | "mapear";

export function ImportarExcelModal({ onClose, onImportado }: ImportarExcelModalProps) {
  const [paso, setPaso] = useState<Paso>("subir");
  const [analizando, setAnalizando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [cabeceras, setCabeceras] = useState<string[]>([]);
  const [filasMuestra, setFilasMuestra] = useState<string[][]>([]);
  const [totalFilas, setTotalFilas] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [columnaFecha, setColumnaFecha] = useState<string>("");
  const [columnaImporte, setColumnaImporte] = useState<string>("");
  const [columnaCategoria, setColumnaCategoria] = useState<string>("");
  const [columnaDescripcion, setColumnaDescripcion] = useState<string>("");

  async function handleAnalizar(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Selecciona un archivo Excel");
      return;
    }
    setAnalizando(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/gastos/analizar-excel", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al analizar el Excel");
        return;
      }
      setCabeceras(data.cabeceras);
      setFilasMuestra(data.filasMuestra);
      setTotalFilas(data.totalFilas);
      setPaso("mapear");
    } finally {
      setAnalizando(false);
    }
  }

  async function handleImportar() {
    if (!columnaFecha || !columnaImporte) {
      toast.error("Selecciona al menos las columnas de fecha e importe");
      return;
    }
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setImportando(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "mapeo",
        JSON.stringify({
          columnaFecha: Number(columnaFecha),
          columnaImporte: Number(columnaImporte),
          columnaCategoria: columnaCategoria ? Number(columnaCategoria) : null,
          columnaDescripcion: columnaDescripcion ? Number(columnaDescripcion) : null,
        })
      );
      const res = await fetch("/api/gastos/importar-excel", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al importar el Excel");
        return;
      }
      if (data.filasConError.length > 0) {
        toast.success(
          `${data.importados} gasto(s) importado(s). ${data.filasConError.length} fila(s) no se pudieron leer.`
        );
      } else {
        toast.success(`${data.importados} gasto(s) importado(s) correctamente`);
      }
      onImportado();
      onClose();
    } finally {
      setImportando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg w-full max-w-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-display text-lg uppercase tracking-wide text-[var(--text-primary)]">
              Importar gastos desde Excel
            </h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={18} />
          </button>
        </div>

        {paso === "subir" && (
          <form onSubmit={handleAnalizar} className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Sube un Excel con tus propios datos de gastos. En el siguiente paso podrás indicar
              qué columna corresponde a cada dato.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              required
              accept=".xlsx,.xls"
              className="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-[var(--bg-panel-raised)] file:text-[var(--text-primary)] file:text-xs"
            />
            <button
              type="submit"
              disabled={analizando}
              className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-sm rounded-md px-4 py-2 transition-colors"
            >
              {analizando ? "Analizando..." : "Continuar"}
              {!analizando && <ArrowRight size={15} />}
            </button>
          </form>
        )}

        {paso === "mapear" && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              {totalFilas} fila(s) detectada(s). Indica qué columna corresponde a cada dato:
            </p>

            <div className="grid grid-cols-2 gap-4">
              <ColumnaSelector
                label="Fecha"
                requerido
                cabeceras={cabeceras}
                valor={columnaFecha}
                onChange={setColumnaFecha}
              />
              <ColumnaSelector
                label="Importe"
                requerido
                cabeceras={cabeceras}
                valor={columnaImporte}
                onChange={setColumnaImporte}
              />
              <ColumnaSelector
                label="Categoría (opcional)"
                cabeceras={cabeceras}
                valor={columnaCategoria}
                onChange={setColumnaCategoria}
              />
              <ColumnaSelector
                label="Descripción (opcional)"
                cabeceras={cabeceras}
                valor={columnaDescripcion}
                onChange={setColumnaDescripcion}
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Vista previa de las primeras filas
              </p>
              <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-md">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)]">
                      {cabeceras.map((c, i) => (
                        <th
                          key={i}
                          className="px-2.5 py-1.5 text-left text-[var(--text-muted)] font-medium whitespace-nowrap"
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filasMuestra.map((fila, i) => (
                      <tr key={i} className="border-b border-[var(--border-subtle)] last:border-0">
                        {fila.map((celda, j) => (
                          <td key={j} className="px-2.5 py-1.5 text-[var(--text-secondary)] whitespace-nowrap">
                            {celda}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              Si la categoría no coincide exactamente con una de las categorías de la app, se
              intentará detectar automáticamente por palabras clave; si no se reconoce, se
              clasificará como &quot;Otros&quot;.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleImportar}
                disabled={importando}
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-sm rounded-md px-4 py-2 transition-colors"
              >
                {importando ? "Importando..." : `Importar ${totalFilas} gasto(s)`}
              </button>
              <button
                onClick={() => setPaso("subir")}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-4 py-2 transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ColumnaSelector({
  label,
  requerido,
  cabeceras,
  valor,
  onChange,
}: {
  label: string;
  requerido?: boolean;
  cabeceras: string[];
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
        {label} {requerido && <span style={{ color: "var(--accent)" }}>*</span>}
      </label>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
      >
        <option value="">— Sin asignar —</option>
        {cabeceras.map((c, i) => (
          <option key={i} value={i + 1}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
