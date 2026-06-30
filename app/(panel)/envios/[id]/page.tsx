"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Paperclip,
  Send,
  Trash2,
  Download,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { EstadoBadge } from "@/components/EstadoBadge";
import { ESTADOS_LIST } from "@/lib/constants";

interface CambioEstado {
  id: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  nota: string | null;
  createdAt: string;
  creadoPor: { nombre: string };
}

interface Comentario {
  id: string;
  texto: string;
  createdAt: string;
  creadoPor: { nombre: string };
}

interface Adjunto {
  id: string;
  nombreArchivo: string;
  tipoArchivo: string;
  tamano: number;
  createdAt: string;
}

interface EnvioDetalle {
  id: string;
  numeroSeguimiento: string;
  mensajero: string;
  estado: string;
  motivo: string | null;
  descripcion: string | null;
  destinatario: string | null;
  direccion: string | null;
  fechaEnvio: string | null;
  fechaInforme: string | null;
  ultimaActualizacion: string;
  createdAt: string;
  creadoPor: { nombre: string; email: string };
  cambiosEstado: CambioEstado[];
  comentarios: Comentario[];
  adjuntos: Adjunto[];
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DetalleEnvioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [envio, setEnvio] = useState<EnvioDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [notaEstado, setNotaEstado] = useState("");
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [comentario, setComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [eliminandoEnvio, setEliminandoEnvio] = useState(false);

  const cargarEnvio = useCallback(async () => {
    try {
      const res = await fetch(`/api/envios/${id}`);
      const data = await res.json();
      if (res.ok) {
        setEnvio(data.envio);
        setNuevoEstado(data.envio.estado);
      } else {
        toast.error(data.error || "Envío no encontrado");
        router.push("/");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    let activo = true;
    (async () => {
      const res = await fetch(`/api/envios/${id}`);
      const data = await res.json();
      if (!activo) return;
      if (res.ok) {
        setEnvio(data.envio);
        setNuevoEstado(data.envio.estado);
      } else {
        toast.error(data.error || "Envío no encontrado");
        router.push("/");
      }
      setLoading(false);
    })().catch(() => {
      if (activo) {
        toast.error("Error de conexión");
        setLoading(false);
      }
    });
    return () => {
      activo = false;
    };
  }, [id, router]);

  async function handleCambiarEstado() {
    if (!envio || nuevoEstado === envio.estado) return;
    setCambiandoEstado(true);
    try {
      const res = await fetch(`/api/envios/${id}/estado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estadoNuevo: nuevoEstado, nota: notaEstado }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al cambiar el estado");
      } else {
        toast.success("Estado actualizado");
        setNotaEstado("");
        cargarEnvio();
      }
    } finally {
      setCambiandoEstado(false);
    }
  }

  async function handleComentario(e: React.FormEvent) {
    e.preventDefault();
    if (!comentario.trim()) return;
    setEnviandoComentario(true);
    try {
      const res = await fetch(`/api/envios/${id}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: comentario }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al añadir el comentario");
      } else {
        setComentario("");
        cargarEnvio();
      }
    } finally {
      setEnviandoComentario(false);
    }
  }

  async function handleArchivoSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoArchivo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/envios/${id}/adjuntos`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al subir el archivo");
      } else {
        toast.success("Archivo adjuntado");
        cargarEnvio();
      }
    } finally {
      setSubiendoArchivo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleEliminarAdjunto(adjuntoId: string) {
    if (!confirm("¿Eliminar este adjunto?")) return;
    const res = await fetch(`/api/adjuntos/${adjuntoId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Adjunto eliminado");
      cargarEnvio();
    } else {
      toast.error("Error al eliminar el adjunto");
    }
  }

  async function handleEliminarEnvio() {
    if (!envio) return;
    if (
      !confirm(
        `¿Eliminar definitivamente el envío ${envio.numeroSeguimiento}? Esta acción no se puede deshacer.`
      )
    )
      return;
    setEliminandoEnvio(true);
    try {
      const res = await fetch(`/api/envios/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Envío eliminado");
        router.push("/");
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al eliminar el envío");
        setEliminandoEnvio(false);
      }
    } catch {
      toast.error("Error de conexión");
      setEliminandoEnvio(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-[var(--text-secondary)]">Cargando...</div>;
  }

  if (!envio) return null;

  return (
    <div className="p-8 max-w-4xl">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-5 transition-colors"
      >
        <ArrowLeft size={15} /> Volver al listado
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-mono text-2xl text-[var(--text-primary)]">
              {envio.numeroSeguimiento}
            </h1>
            <EstadoBadge estado={envio.estado} />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {envio.mensajero}
            {envio.destinatario && ` · Destinatario: ${envio.destinatario}`}
          </p>
        </div>
        <button
          onClick={handleEliminarEnvio}
          disabled={eliminandoEnvio}
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--status-perdido)] disabled:opacity-50 transition-colors"
        >
          <Trash2 size={15} />
          {eliminandoEnvio ? "Eliminando..." : "Eliminar envío"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="col-span-2 space-y-6">
          {/* Datos del envío */}
          <section className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
              Detalles del envío
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-[var(--text-muted)] text-xs mb-0.5">Motivo</dt>
                <dd className="text-[var(--text-primary)]">{envio.motivo || "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs mb-0.5">Dirección</dt>
                <dd className="text-[var(--text-primary)]">{envio.direccion || "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs mb-0.5">Fecha de envío</dt>
                <dd className="text-[var(--text-primary)] font-mono">
                  {envio.fechaEnvio
                    ? new Date(envio.fechaEnvio).toLocaleDateString("es-ES")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs mb-0.5">Fecha en la que se informa</dt>
                <dd className="text-[var(--text-primary)] font-mono">
                  {envio.fechaInforme
                    ? new Date(envio.fechaInforme).toLocaleDateString("es-ES")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs mb-0.5">Registrado por</dt>
                <dd className="text-[var(--text-primary)]">{envio.creadoPor.nombre}</dd>
              </div>
              {envio.descripcion && (
                <div className="col-span-2">
                  <dt className="text-[var(--text-muted)] text-xs mb-0.5">Descripción</dt>
                  <dd className="text-[var(--text-primary)] leading-relaxed">
                    {envio.descripcion}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Histórico de estados */}
          <section className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
              Histórico de estados
            </h2>
            <div className="space-y-3">
              {envio.cambiosEstado.map((c) => (
                <div key={c.id} className="flex gap-3 text-sm">
                  <div className="w-1 rounded-full bg-[var(--border-strong)] shrink-0" />
                  <div className="flex-1 pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <EstadoBadge estado={c.estadoNuevo} />
                      <span className="text-xs text-[var(--text-muted)]">
                        por {c.creadoPor.nombre} ·{" "}
                        {new Date(c.createdAt).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {c.nota && (
                      <p className="text-[var(--text-secondary)] mt-1">{c.nota}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Comentarios */}
          <section className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
              Notas y comentarios
            </h2>
            <div className="space-y-3 mb-4">
              {envio.comentarios.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">
                  Todavía no hay comentarios.
                </p>
              )}
              {envio.comentarios.map((c) => (
                <div key={c.id} className="text-sm border-l-2 border-[var(--border-strong)] pl-3">
                  <p className="text-[var(--text-primary)]">{c.texto}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {c.creadoPor.nombre} ·{" "}
                    {new Date(c.createdAt).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
            <form onSubmit={handleComentario} className="flex gap-2">
              <input
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Añadir una nota..."
                className="flex-1 bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors"
              />
              <button
                type="submit"
                disabled={enviandoComentario}
                className="bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 hover:border-[var(--accent)] transition-colors disabled:opacity-50"
              >
                <Send size={15} className="text-[var(--text-secondary)]" />
              </button>
            </form>
          </section>

          {/* Adjuntos */}
          <section className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                Adjuntos
              </h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={subiendoArchivo}
                className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors disabled:opacity-50"
              >
                <Paperclip size={13} />
                {subiendoArchivo ? "Subiendo..." : "Adjuntar archivo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleArchivoSeleccionado}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
            </div>
            {envio.adjuntos.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Sin adjuntos todavía.</p>
            ) : (
              <div className="space-y-2">
                {envio.adjuntos.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between bg-[var(--bg-panel-raised)] rounded-md px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 text-[var(--text-primary)] truncate">
                      {a.tipoArchivo.startsWith("image/") ? (
                        <ImageIcon size={15} className="text-[var(--text-muted)] shrink-0" />
                      ) : (
                        <FileText size={15} className="text-[var(--text-muted)] shrink-0" />
                      )}
                      <span className="truncate">{a.nombreArchivo}</span>
                      <span className="text-xs text-[var(--text-muted)] shrink-0">
                        ({formatBytes(a.tamano)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/api/adjuntos/${a.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                      >
                        <Download size={15} />
                      </a>
                      <button
                        onClick={() => handleEliminarAdjunto(a.id)}
                        className="text-[var(--text-muted)] hover:text-[var(--status-perdido)] transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Columna lateral — cambiar estado */}
        <div>
          <section className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5 sticky top-8">
            <h2 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
              Cambiar estado
            </h2>
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] mb-3 focus:border-[var(--accent)] transition-colors"
            >
              {ESTADOS_LIST.map((e) => (
                <option key={e.key} value={e.key}>
                  {e.label}
                </option>
              ))}
            </select>
            <textarea
              value={notaEstado}
              onChange={(e) => setNotaEstado(e.target.value)}
              placeholder="Nota sobre este cambio (opcional)"
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] mb-3 min-h-[70px] resize-y focus:border-[var(--accent)] transition-colors"
            />
            <button
              onClick={handleCambiarEstado}
              disabled={cambiandoEstado || nuevoEstado === envio.estado}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-[#1a1408] font-semibold text-sm rounded-md py-2.5 transition-colors"
            >
              {cambiandoEstado ? "Actualizando..." : "Actualizar estado"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
