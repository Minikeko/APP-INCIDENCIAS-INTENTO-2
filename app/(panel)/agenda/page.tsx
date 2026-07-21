"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { CalendarDays, Plus, StickyNote, Share2, Trash2, X, Paperclip, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { VistaMes } from "@/components/agenda/VistaMes";
import { VistaSemana } from "@/components/agenda/VistaSemana";
import { VistaDia } from "@/components/agenda/VistaDia";
import { ModalEvento, DatosEvento } from "@/components/agenda/ModalEvento";
import { DetalleEvento } from "@/components/agenda/DetalleEvento";
import { Evento, Vista, COLORES } from "@/components/agenda/tipos";

interface Usuario { id: string; nombre: string; activo: boolean; }
interface NotaAdjunto {
  id: string; nombreArchivo: string; tipoArchivo: string; tamano: number; createdAt: string;
}
interface Nota {
  id: string; titulo: string; contenido: string; color: string; updatedAt: string;
  autor?: { id: string; nombre: string };
  compartidaCon: { user: { id: string; nombre: string } }[];
  adjuntos: NotaAdjunto[];
}
interface NotaEditando { id: string; titulo: string; contenido: string; }
interface SessionUser { userId: string; nombre: string; role: string; }

export default function AgendaPage() {
  const [me, setMe] = useState<SessionUser | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [notasPropias, setNotasPropias] = useState<Nota[]>([]);
  const [notasCompartidas, setNotasCompartidas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado de navegación
  const hoy = new Date();
  const [vista, setVista] = useState<Vista>("mes");
  const [fechaRef, setFechaRef] = useState(hoy);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [tab, setTab] = useState<"calendario" | "notas">("calendario");

  // Modales
  const [modalEvento, setModalEvento] = useState(false);
  const [eventoEditar, setEventoEditar] = useState<Evento | null>(null);
  const [eventoDetalle, setEventoDetalle] = useState<Evento | null>(null);
  const [fechaInicialModal, setFechaInicialModal] = useState<string | undefined>();
  const [guardando, setGuardando] = useState(false);

  // Notas
  const [modalNota, setModalNota] = useState(false);
  const [formNota, setFormNota] = useState({ titulo: "", contenido: "", color: COLORES[0] });
  const [notaEditando, setNotaEditando] = useState<NotaEditando | null>(null);
  const [modalCompartir, setModalCompartir] = useState<Nota | null>(null);
  const [compartirIds, setCompartirIds] = useState<string[]>([]);
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [subiendoAdjunto, setSubiendoAdjunto] = useState<string | null>(null); // id de la nota
  const adjuntoInputRef = useRef<HTMLInputElement>(null);
  const [notaParaAdjunto, setNotaParaAdjunto] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      const [meR, usR] = await Promise.all([fetch("/api/auth/me"), fetch("/api/usuarios")]);
      const meD = await meR.json();
      const usD = await usR.json();
      if (!activo) return;
      setMe(meD.user);
      setUsuarios((usD.usuarios || []).filter((u: Usuario) => u.activo));
    })();
    return () => { activo = false; };
  }, []);

  const cargarEventos = useCallback(async () => {
    // Cargar eventos con un margen amplio para cubrir cualquier vista
    const desde = new Date(anio, mes - 1, 1).toISOString();
    const hasta = new Date(anio, mes + 2, 0, 23, 59, 59).toISOString();
    const res = await fetch(`/api/agenda?desde=${desde}&hasta=${hasta}`);
    const data = await res.json();
    if (res.ok) setEventos(data.eventos);
  }, [anio, mes]);

  const cargarNotas = useCallback(async () => {
    const res = await fetch("/api/notas");
    const data = await res.json();
    if (res.ok) {
      setNotasPropias(data.propias);
      setNotasCompartidas(data.compartidas);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      setLoading(true);
      await Promise.all([cargarEventos(), cargarNotas()]);
      if (activo) setLoading(false);
    })();
    return () => { activo = false; };
  }, [cargarEventos, cargarNotas]);

  // ===== Navegación =====
  function cambiarMes(delta: number) {
    const nuevo = new Date(anio, mes + delta, 1);
    setAnio(nuevo.getFullYear());
    setMes(nuevo.getMonth());
    setFechaRef(nuevo);
  }

  function cambiarSemana(delta: number) {
    const nueva = new Date(fechaRef);
    nueva.setDate(nueva.getDate() + delta * 7);
    setFechaRef(nueva);
    setAnio(nueva.getFullYear());
    setMes(nueva.getMonth());
  }

  function cambiarDia(delta: number) {
    const nueva = new Date(fechaRef);
    nueva.setDate(nueva.getDate() + delta);
    setFechaRef(nueva);
    setAnio(nueva.getFullYear());
    setMes(nueva.getMonth());
  }

  function irAVista(v: Vista, fecha: Date) {
    setVista(v);
    setFechaRef(fecha);
    setAnio(fecha.getFullYear());
    setMes(fecha.getMonth());
  }

  // ===== Eventos =====
  function abrirNuevoEvento(fecha: Date, hora?: number) {
    const f = new Date(fecha);
    if (hora !== undefined) f.setHours(hora, 0, 0, 0);
    setFechaInicialModal(f.toISOString().slice(0, 16));
    setEventoEditar(null);
    setModalEvento(true);
  }

  async function guardarEvento(datos: DatosEvento) {
    setGuardando(true);
    try {
      const url = eventoEditar ? `/api/agenda/${eventoEditar.id}` : "/api/agenda";
      const method = eventoEditar ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error al guardar"); return; }
      toast.success(eventoEditar ? "Evento actualizado" : "Evento creado");
      setModalEvento(false);
      setEventoEditar(null);
      setEventoDetalle(null);
      cargarEventos();
    } finally { setGuardando(false); }
  }

  async function eliminarEvento(id: string) {
    if (!confirm("¿Eliminar este evento?")) return;
    const res = await fetch(`/api/agenda/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Evento eliminado");
      setEventoDetalle(null);
      setModalEvento(false);
      cargarEventos();
    } else toast.error("Error al eliminar");
  }

  // ===== Notas =====
  async function crearNota(e: React.FormEvent) {
    e.preventDefault();
    if (!formNota.titulo || !formNota.contenido) { toast.error("Título y contenido obligatorios"); return; }
    setGuardandoNota(true);
    try {
      const res = await fetch("/api/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formNota),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error"); return; }
      toast.success("Nota creada");
      setModalNota(false);
      setFormNota({ titulo: "", contenido: "", color: COLORES[0] });
      cargarNotas();
    } finally { setGuardandoNota(false); }
  }

  async function guardarNota() {
    if (!notaEditando) return;
    const res = await fetch(`/api/notas/${notaEditando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: notaEditando.titulo, contenido: notaEditando.contenido }),
    });
    if (res.ok) { toast.success("Nota guardada"); setNotaEditando(null); cargarNotas(); }
    else toast.error("Error al guardar");
  }

  async function eliminarNota(id: string) {
    if (!confirm("¿Eliminar esta nota?")) return;
    const res = await fetch(`/api/notas/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Nota eliminada"); cargarNotas(); }
    else toast.error("Error al eliminar");
  }

  async function compartirNota() {
    if (!modalCompartir) return;
    const res = await fetch(`/api/notas/${modalCompartir.id}/compartir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuariosIds: compartirIds }),
    });
    if (res.ok) { toast.success("Nota compartida"); setModalCompartir(null); cargarNotas(); }
    else toast.error("Error al compartir");
  }

  async function subirAdjuntoNota(notaId: string, file: File) {
    setSubiendoAdjunto(notaId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/notas/${notaId}/adjuntos`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error al subir el archivo"); return; }
      toast.success("Archivo añadido");
      cargarNotas();
    } finally {
      setSubiendoAdjunto(null);
      if (adjuntoInputRef.current) adjuntoInputRef.current.value = "";
    }
  }

  async function eliminarAdjuntoNota(adjuntoId: string) {
    const res = await fetch(`/api/notas/adjuntos/${adjuntoId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Archivo eliminado"); cargarNotas(); }
    else toast.error("Error al eliminar");
  }


  return (
    <div className="flex flex-col h-screen p-4 gap-4 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <CalendarDays size={20} style={{ color: "var(--accent)" }} />
          <h1 className="font-display text-xl uppercase tracking-wide text-[var(--text-primary)]">Agenda</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Tab calendario / notas */}
          <div className="flex bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-0.5">
            <button onClick={() => setTab("calendario")} className={`text-xs px-3 py-1.5 rounded-md transition-colors ${tab === "calendario" ? "bg-[var(--accent-dim)] text-[var(--accent)] font-medium" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Calendario</button>
            <button onClick={() => setTab("notas")} className={`text-xs px-3 py-1.5 rounded-md transition-colors ${tab === "notas" ? "bg-[var(--accent-dim)] text-[var(--accent)] font-medium" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Notas</button>
          </div>

          {tab === "calendario" && (
            <>
              {/* Selector de vista */}
              <div className="flex bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-0.5">
                {(["mes", "semana", "dia"] as Vista[]).map((v) => (
                  <button key={v} onClick={() => setVista(v)} className={`text-xs px-3 py-1.5 rounded-md capitalize transition-colors ${vista === v ? "bg-[var(--accent-dim)] text-[var(--accent)] font-medium" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>{v === "dia" ? "Día" : v === "mes" ? "Mes" : "Semana"}</button>
                ))}
              </div>
              <button onClick={() => { setFechaRef(hoy); setAnio(hoy.getFullYear()); setMes(hoy.getMonth()); }} className="text-xs px-3 py-1.5 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Hoy</button>
            </>
          )}

          <button
            onClick={() => {
              if (tab === "notas") { setModalNota(true); }
              else { abrirNuevoEvento(new Date()); }
            }}
            className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#1a1408] font-semibold text-sm rounded-lg px-3 py-2 transition-colors"
          >
            <Plus size={14} /> {tab === "notas" ? "Nota" : "Evento"}
          </button>
        </div>
      </div>

      {tab === "calendario" && (
        <div className="flex-1 grid grid-cols-4 gap-4 overflow-hidden min-h-0">
          {/* Vista principal */}
          <div className="col-span-3 overflow-hidden">
            {vista === "mes" && (
              <VistaMes
                anio={anio} mes={mes} eventos={eventos}
                onCambiarMes={cambiarMes}
                onDiaClick={(d) => abrirNuevoEvento(d)}
                onEventoClick={setEventoDetalle}
                onCambiarVista={irAVista}
              />
            )}
            {vista === "semana" && (
              <VistaSemana
                fechaRef={fechaRef} eventos={eventos}
                onCambiarSemana={cambiarSemana}
                onHoraClick={(f, h) => abrirNuevoEvento(f, h)}
                onEventoClick={setEventoDetalle}
                onDiaClick={(d) => irAVista("dia", d)}
              />
            )}
            {vista === "dia" && (
              <VistaDia
                fecha={fechaRef} eventos={eventos}
                onCambiarDia={cambiarDia}
                onHoraClick={(f, h) => abrirNuevoEvento(f, h)}
                onEventoClick={setEventoDetalle}
              />
            )}
          </div>

          {/* Panel lateral */}
          <div className="col-span-1 flex flex-col gap-3 overflow-y-auto">
            {eventoDetalle ? (
              <DetalleEvento
                evento={eventoDetalle}
                miId={me?.userId ?? ""}
                onCerrar={() => setEventoDetalle(null)}
                onEditar={() => { setEventoEditar(eventoDetalle); setModalEvento(true); }}
                onEliminar={eliminarEvento}
              />
            ) : (
              <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4">
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">Próximos eventos</p>
                {loading ? (
                  <p className="text-xs text-[var(--text-muted)]">Cargando...</p>
                ) : eventos.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] text-center py-4">Sin eventos</p>
                ) : (
                  <div className="space-y-2">
                    {[...eventos]
                      .filter((ev) => new Date(ev.fechaInicio) >= new Date(new Date().setHours(0,0,0,0)))
                      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())
                      .slice(0, 6)
                      .map((ev) => (
                        <button key={ev.id} onClick={() => setEventoDetalle(ev)} className="w-full text-left rounded-lg px-3 py-2 hover:bg-[var(--bg-panel-raised)] transition-colors border border-[var(--border-subtle)] hover:border-[var(--accent)]">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                            <p className="text-xs text-[var(--text-primary)] font-medium truncate">{ev.titulo}</p>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 pl-4">
                            {new Date(ev.fechaInicio).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" })}
                            {!ev.todoElDia && ` · ${new Date(ev.fechaInicio).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`}
                          </p>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Mini-leyenda de vista */}
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-3 text-xs text-[var(--text-muted)] space-y-1">
              <p className="font-medium text-[var(--text-secondary)] mb-2">Atajos</p>
              <p>· Clic en día → nuevo evento</p>
              <p>· Clic en número de día → vista de día</p>
              <p>· Clic en mes (título) → vista semanal</p>
              <p>· Clic en evento → ver detalle</p>
            </div>
          </div>
        </div>
      )}

      {tab === "notas" && (
        <div className="flex-1 overflow-y-auto">
          {notasPropias.length === 0 && notasCompartidas.length === 0 && !loading && (
            <p className="text-sm text-[var(--text-muted)] bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl px-4 py-8 text-center">
              No tienes notas todavía.
            </p>
          )}
          {notasPropias.length > 0 && (
            <>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">Mis notas</p>
              {/* Input oculto para subir adjuntos */}
              <input
                ref={adjuntoInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && notaParaAdjunto) subirAdjuntoNota(notaParaAdjunto, file);
                }}
              />
              <div className="grid grid-cols-4 gap-3 mb-6">
                {notasPropias.map((nota) => (
                  <div key={nota.id} className="rounded-xl border border-[var(--border-subtle)] overflow-hidden flex flex-col" style={{ borderLeftColor: nota.color, borderLeftWidth: 3 }}>
                    {notaEditando?.id === nota.id ? (
                      <div className="p-3 flex flex-col gap-2 flex-1">
                        <input value={notaEditando.titulo} onChange={(e) => setNotaEditando({ ...notaEditando, titulo: e.target.value })} className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded px-2 py-1 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors" />
                        <textarea value={notaEditando.contenido} onChange={(e) => setNotaEditando({ ...notaEditando, contenido: e.target.value })} className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded px-2 py-1 text-xs text-[var(--text-secondary)] min-h-[80px] resize-none focus:border-[var(--accent)] transition-colors flex-1" />
                        <div className="flex gap-2">
                          <button onClick={guardarNota} className="text-xs bg-[var(--accent)] text-[#1a1408] px-3 py-1 rounded-md font-semibold">Guardar</button>
                          <button onClick={() => setNotaEditando(null)} className="text-xs text-[var(--text-muted)] px-3 py-1">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 flex flex-col gap-2 flex-1">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{nota.titulo}</p>
                        <p className="text-xs text-[var(--text-secondary)] flex-1 whitespace-pre-wrap line-clamp-4">{nota.contenido}</p>

                        {/* Adjuntos */}
                        {nota.adjuntos.length > 0 && (
                          <div className="space-y-1.5 mt-1">
                            {nota.adjuntos.map((adj) => (
                              <div key={adj.id} className="group relative">
                                {adj.tipoArchivo.startsWith("image/") ? (
                                  <div className="relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={`/api/notas/adjuntos/${adj.id}`}
                                      alt={adj.nombreArchivo}
                                      className="w-full max-h-32 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(`/api/notas/adjuntos/${adj.id}`, "_blank")}
                                    />
                                    <button
                                      onClick={() => eliminarAdjuntoNota(adj.id)}
                                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-1 bg-[var(--bg-panel-raised)] rounded px-2 py-1">
                                    <a
                                      href={`/api/notas/adjuntos/${adj.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 min-w-0 hover:text-[var(--accent)] transition-colors"
                                    >
                                      <FileText size={12} className="text-[var(--text-muted)] shrink-0" />
                                      <span className="text-[10px] text-[var(--text-secondary)] truncate">{adj.nombreArchivo}</span>
                                    </a>
                                    <button onClick={() => eliminarAdjuntoNota(adj.id)} className="shrink-0 text-[var(--text-muted)] hover:text-[var(--status-perdido)] transition-colors opacity-0 group-hover:opacity-100">
                                      <X size={10} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {nota.compartidaCon.length > 0 && (
                          <p className="text-[10px] text-[var(--text-muted)]">Con: {nota.compartidaCon.map((c) => c.user.nombre).join(", ")}</p>
                        )}
                        <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-subtle)]">
                          <button onClick={() => setNotaEditando({ id: nota.id, titulo: nota.titulo, contenido: nota.contenido })} className="text-[10px] text-[var(--accent)] hover:underline">Editar</button>
                          <button
                            onClick={() => { setNotaParaAdjunto(nota.id); adjuntoInputRef.current?.click(); }}
                            disabled={subiendoAdjunto === nota.id}
                            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] flex items-center gap-0.5 transition-colors"
                          >
                            <Paperclip size={10} />
                            {subiendoAdjunto === nota.id ? "Subiendo..." : "Adjuntar"}
                          </button>
                          <button onClick={() => { setModalCompartir(nota); setCompartirIds(nota.compartidaCon.map((c) => c.user.id)); }} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] flex items-center gap-0.5 transition-colors"><Share2 size={10} /> Compartir</button>
                          <button onClick={() => eliminarNota(nota.id)} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--status-perdido)] flex items-center gap-0.5 ml-auto transition-colors"><Trash2 size={10} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          {notasCompartidas.length > 0 && (
            <>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">Compartidas conmigo</p>
              <div className="grid grid-cols-4 gap-3">
                {notasCompartidas.map((nota) => (
                  <div key={nota.id} className="rounded-xl border border-[var(--border-subtle)] p-3 flex flex-col gap-2" style={{ borderLeftColor: nota.color, borderLeftWidth: 3 }}>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{nota.titulo}</p>
                    <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap line-clamp-4">{nota.contenido}</p>
                    {nota.adjuntos.length > 0 && (
                      <div className="space-y-1.5">
                        {nota.adjuntos.map((adj) => (
                          adj.tipoArchivo.startsWith("image/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={adj.id} src={`/api/notas/adjuntos/${adj.id}`} alt={adj.nombreArchivo} className="w-full max-h-28 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(`/api/notas/adjuntos/${adj.id}`, "_blank")} />
                          ) : (
                            <a key={adj.id} href={`/api/notas/adjuntos/${adj.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-[var(--bg-panel-raised)] rounded px-2 py-1 hover:text-[var(--accent)] transition-colors">
                              <FileText size={11} className="text-[var(--text-muted)] shrink-0" />
                              <span className="text-[10px] text-[var(--text-secondary)] truncate">{adj.nombreArchivo}</span>
                            </a>
                          )
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-[var(--text-muted)] mt-auto pt-1 border-t border-[var(--border-subtle)]">De: {nota.autor?.nombre}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal de evento */}
      {modalEvento && me && (
        <ModalEvento
          evento={eventoEditar}
          fechaInicial={fechaInicialModal}
          usuarios={usuarios}
          miId={me.userId}
          onGuardar={guardarEvento}
          onEliminar={eliminarEvento}
          onCerrar={() => { setModalEvento(false); setEventoEditar(null); }}
          guardando={guardando}
        />
      )}

      {/* Modal nueva nota */}
      {modalNota && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><StickyNote size={16} style={{ color: "var(--accent)" }} /><h2 className="font-display text-lg uppercase tracking-wide text-[var(--text-primary)]">Nueva nota</h2></div>
              <button onClick={() => setModalNota(false)}><X size={18} className="text-[var(--text-muted)]" /></button>
            </div>
            <form onSubmit={crearNota} className="space-y-3">
              <input required value={formNota.titulo} onChange={(e) => setFormNota((f) => ({ ...f, titulo: e.target.value }))} placeholder="Título" className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors" />
              <textarea required value={formNota.contenido} onChange={(e) => setFormNota((f) => ({ ...f, contenido: e.target.value }))} placeholder="Escribe tu nota aquí..." className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] min-h-[120px] resize-none focus:border-[var(--accent)] transition-colors" />
              <div><label className="block text-xs text-[var(--text-muted)] mb-1.5">Color</label><div className="flex gap-2">{COLORES.map((c) => <button key={c} type="button" onClick={() => setFormNota((f) => ({ ...f, color: c }))} className="w-6 h-6 rounded-full border-2 transition-all" style={{ backgroundColor: c, borderColor: formNota.color === c ? "white" : "transparent", transform: formNota.color === c ? "scale(1.2)" : "scale(1)" }} />)}</div></div>
              <button type="submit" disabled={guardandoNota} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-sm rounded-lg py-2.5 transition-colors">{guardandoNota ? "Creando..." : "Crear nota"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal compartir nota */}
      {modalCompartir && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg uppercase tracking-wide text-[var(--text-primary)]">Compartir nota</h2>
              <button onClick={() => setModalCompartir(null)}><X size={18} className="text-[var(--text-muted)]" /></button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 border border-[var(--border-subtle)] rounded-lg p-2 mb-4">
              {usuarios.filter((u) => u.id !== me?.userId).map((u) => (
                <label key={u.id} className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-[var(--bg-panel-raised)] cursor-pointer">
                  <input type="checkbox" checked={compartirIds.includes(u.id)} onChange={() => setCompartirIds((prev) => prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id])} className="accent-[var(--accent)]" />
                  <span className="text-sm text-[var(--text-primary)]">{u.nombre}</span>
                </label>
              ))}
            </div>
            <button onClick={compartirNota} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#1a1408] font-semibold text-sm rounded-lg py-2.5 transition-colors">Guardar</button>
          </div>
        </div>
      )}
    </div>
  );
}
