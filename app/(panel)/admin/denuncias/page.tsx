"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ScrollText, Plus, Download, Trash2, X, Search } from "lucide-react";
import toast from "react-hot-toast";

interface EnvioResumen {
  id: string;
  numeroSeguimiento: string;
  mensajero: string;
}

interface Denuncia {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  archivoOriginalNombre: string | null;
  createdAt: string;
  creadoPor: { nombre: string };
  envios: { envio: EnvioResumen }[];
}

export default function DenunciasPage() {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ titulo: "", descripcion: "", fecha: "" });
  const [busquedaEnvio, setBusquedaEnvio] = useState("");
  const [resultadosEnvio, setResultadosEnvio] = useState<EnvioResumen[]>([]);
  const [enviosSeleccionados, setEnviosSeleccionados] = useState<EnvioResumen[]>([]);

  const cargarDenuncias = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/denuncias");
    const data = await res.json();
    if (res.ok) setDenuncias(data.denuncias);
    setLoading(false);
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      setLoading(true);
      const res = await fetch("/api/denuncias");
      const data = await res.json();
      if (!activo) return;
      if (res.ok) setDenuncias(data.denuncias);
      setLoading(false);
    })();
    return () => {
      activo = false;
    };
  }, []);

  // Búsqueda de envíos para enlazar a la denuncia
  useEffect(() => {
    let activo = true;
    const timeout = setTimeout(async () => {
      if (!busquedaEnvio.trim()) {
        if (activo) setResultadosEnvio([]);
        return;
      }
      const res = await fetch(`/api/envios?q=${encodeURIComponent(busquedaEnvio)}`);
      const data = await res.json();
      if (activo && res.ok) setResultadosEnvio(data.envios.slice(0, 8));
    }, 300);
    return () => {
      activo = false;
      clearTimeout(timeout);
    };
  }, [busquedaEnvio]);

  function añadirEnvio(envio: EnvioResumen) {
    if (!enviosSeleccionados.some((e) => e.id === envio.id)) {
      setEnviosSeleccionados((prev) => [...prev, envio]);
    }
    setBusquedaEnvio("");
    setResultadosEnvio([]);
  }

  function quitarEnvio(id: string) {
    setEnviosSeleccionados((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append("titulo", form.titulo.trim());
      if (form.descripcion.trim()) formData.append("descripcion", form.descripcion.trim());
      if (form.fecha) formData.append("fecha", form.fecha);
      formData.append("enviosIds", JSON.stringify(enviosSeleccionados.map((e) => e.id)));
      const file = fileInputRef.current?.files?.[0];
      if (file) formData.append("file", file);

      const res = await fetch("/api/denuncias", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al registrar la denuncia");
      } else {
        toast.success("Denuncia registrada");
        setForm({ titulo: "", descripcion: "", fecha: "" });
        setEnviosSeleccionados([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setMostrarForm(false);
        cargarDenuncias();
      }
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar esta denuncia?")) return;
    const res = await fetch(`/api/denuncias/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Denuncia eliminada");
      cargarDenuncias();
    } else {
      toast.error("Error al eliminar");
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <ScrollText size={20} style={{ color: "var(--accent)" }} />
          <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)]">
            Denuncias
          </h1>
        </div>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#1a1408] font-semibold text-sm rounded-md px-4 py-2 transition-colors"
        >
          <Plus size={15} />
          Nueva denuncia
        </button>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Registra denuncias redactadas en la app o sube un PDF ya existente. Visible solo para administradores.
      </p>

      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5 mb-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Título
              </label>
              <input
                required
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Descripción (se usa para generar el PDF si no subes uno)
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] min-h-[100px] resize-y focus:border-[var(--accent)] transition-colors"
              placeholder="Detalle de la denuncia..."
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              O sube un PDF ya redactado (opcional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-[var(--bg-panel-raised)] file:text-[var(--text-primary)] file:text-xs"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Envíos relacionados (opcional)
            </label>
            {enviosSeleccionados.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {enviosSeleccionados.map((e) => (
                  <span
                    key={e.id}
                    className="flex items-center gap-1.5 bg-[var(--bg-panel-raised)] rounded-full px-3 py-1 text-xs text-[var(--text-primary)] font-mono"
                  >
                    {e.numeroSeguimiento}
                    <button type="button" onClick={() => quitarEnvio(e.id)}>
                      <X size={12} className="text-[var(--text-muted)] hover:text-[var(--status-perdido)]" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={busquedaEnvio}
                onChange={(e) => setBusquedaEnvio(e.target.value)}
                placeholder="Buscar por nº de seguimiento..."
                className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md pl-8 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors"
              />
              {resultadosEnvio.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md overflow-hidden">
                  {resultadosEnvio.map((envio) => (
                    <button
                      type="button"
                      key={envio.id}
                      onClick={() => añadirEnvio(envio)}
                      className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-panel)] transition-colors font-mono"
                    >
                      {envio.numeroSeguimiento}{" "}
                      <span className="text-[var(--text-muted)] font-sans">— {envio.mensajero}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-sm rounded-md px-4 py-2 transition-colors"
          >
            {guardando ? "Guardando..." : "Registrar denuncia"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Cargando...</p>
      ) : denuncias.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-4 py-6 text-center">
          No hay denuncias registradas todavía.
        </p>
      ) : (
        <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg divide-y divide-[var(--border-subtle)]">
          {denuncias.map((d) => (
            <div key={d.id} className="px-5 py-3.5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-[var(--text-primary)] font-medium">{d.titulo}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(d.fecha).toLocaleDateString("es-ES")} · {d.creadoPor.nombre}
                    {d.envios.length > 0 && ` · ${d.envios.length} envío(s) relacionado(s)`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={`/api/denuncias/${d.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                  >
                    <Download size={16} />
                  </a>
                  <button
                    onClick={() => handleEliminar(d.id)}
                    className="text-[var(--text-muted)] hover:text-[var(--status-perdido)] transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
