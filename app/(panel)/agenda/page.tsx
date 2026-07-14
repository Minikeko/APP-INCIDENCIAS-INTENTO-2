"use client";

import { useEffect, useState, useCallback } from "react";
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Trash2, Share2, X, StickyNote } from "lucide-react";
import toast from "react-hot-toast";

interface Usuario { id: string; nombre: string; activo: boolean; }
interface Participante { user: { id: string; nombre: string } }
interface Evento {
  id: string; titulo: string; descripcion: string | null;
  fechaInicio: string; fechaFin: string | null; todoElDia: boolean;
  color: string; creadoPor: { id: string; nombre: string };
  participantes: Participante[];
}
interface Nota {
  id: string; titulo: string; contenido: string; color: string;
  updatedAt: string; autor?: { id: string; nombre: string };
  compartidaCon: { user: { id: string; nombre: string } }[];
}
interface SessionUser { userId: string; nombre: string; role: string; }

const COLORES = ["#e8a33d", "#f87171", "#4ade80", "#60a5fa", "#c084fc", "#fb923c"];
const DIAS = ["L", "M", "X", "J", "V", "S", "D"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function diasDelMes(anio: number, mes: number): (number | null)[] {
  const primerDia = new Date(anio, mes, 1).getDay();
  const offset = primerDia === 0 ? 6 : primerDia - 1;
  const total = new Date(anio, mes + 1, 0).getDate();
  const celdas: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= total; d++) celdas.push(d);
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

export default function AgendaPage() {
  const [me, setMe] = useState<SessionUser | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [notasPropias, setNotasPropias] = useState<Nota[]>([]);
  const [notasCompartidas, setNotasCompartidas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [tab, setTab] = useState<"calendario" | "notas">("calendario");

  // Modales
  const [modalEvento, setModalEvento] = useState(false);
  const [modalNota, setModalNota] = useState(false);
  const [modalCompartir, setModalCompartir] = useState<Nota | null>(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const [formEvento, setFormEvento] = useState({ titulo: "", descripcion: "", fechaInicio: "", fechaFin: "", todoElDia: false, color: "#e8a33d", participantesIds: [] as string[] });
  const [formNota, setFormNota] = useState({ titulo: "", contenido: "", color: "#e8a33d" });
  const [guardando, setGuardando] = useState(false);
  const [compartirIds, setCompartirIds] = useState<string[]>([]);
  const [notaEditando, setNotaEditando] = useState<Nota | null>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      const [meR, usR] = await Promise.all([fetch("/api/auth/me"), fetch("/api/usuarios")]);
      const meD = await meR.json(); const usD = await usR.json();
      if (!activo) return;
      setMe(meD.user);
      setUsuarios((usD.usuarios || []).filter((u: Usuario) => u.activo));
    })();
    return () => { activo = false; };
  }, []);

  const cargarEventos = useCallback(async () => {
    const desde = new Date(anio, mes, 1).toISOString();
    const hasta = new Date(anio, mes + 1, 0, 23, 59, 59).toISOString();
    const res = await fetch(`/api/agenda?desde=${desde}&hasta=${hasta}`);
    const data = await res.json();
    if (res.ok) setEventos(data.eventos);
  }, [anio, mes]);

  const cargarNotas = useCallback(async () => {
    const res = await fetch("/api/notas");
    const data = await res.json();
    if (res.ok) { setNotasPropias(data.propias); setNotasCompartidas(data.compartidas); }
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

  async function crearEvento(e: React.FormEvent) {
    e.preventDefault();
    if (!formEvento.titulo || !formEvento.fechaInicio) { toast.error("Título y fecha son obligatorios"); return; }
    setGuardando(true);
    try {
      const res = await fetch("/api/agenda", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formEvento) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error"); return; }
      toast.success("Evento creado");
      setModalEvento(false);
      setFormEvento({ titulo: "", descripcion: "", fechaInicio: "", fechaFin: "", todoElDia: false, color: "#e8a33d", participantesIds: [] });
      cargarEventos();
    } finally { setGuardando(false); }
  }

  async function eliminarEvento(id: string) {
    if (!confirm("¿Eliminar este evento?")) return;
    const res = await fetch(`/api/agenda/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Evento eliminado"); setEventoSeleccionado(null); cargarEventos(); }
    else toast.error("Error al eliminar");
  }

  async function crearNota(e: React.FormEvent) {
    e.preventDefault();
    if (!formNota.titulo || !formNota.contenido) { toast.error("Título y contenido obligatorios"); return; }
    setGuardando(true);
    try {
      const res = await fetch("/api/notas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formNota) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error"); return; }
      toast.success("Nota creada");
      setModalNota(false);
      setFormNota({ titulo: "", contenido: "", color: "#e8a33d" });
      cargarNotas();
    } finally { setGuardando(false); }
  }

  async function guardarNota(nota: Nota) {
    const res = await fetch(`/api/notas/${nota.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo: nota.titulo, contenido: nota.contenido }) });
    if (res.ok) { toast.success("Nota guardada"); cargarNotas(); setNotaEditando(null); }
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
    const res = await fetch(`/api/notas/${modalCompartir.id}/compartir`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usuariosIds: compartirIds }) });
    if (res.ok) { toast.success("Nota compartida"); setModalCompartir(null); cargarNotas(); }
    else toast.error("Error al compartir");
  }

  const celdas = diasDelMes(anio, mes);
  function eventosDelDia(dia: number) {
    return eventos.filter((ev) => {
      const d = new Date(ev.fechaInicio);
      return d.getFullYear() === anio && d.getMonth() === mes && d.getDate() === dia;
    });
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <CalendarDays size={20} style={{ color: "var(--accent)" }} />
          <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)]">Agenda</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab("calendario")} className={`text-sm px-3 py-1.5 rounded-md transition-colors ${tab === "calendario" ? "bg-[var(--accent-dim)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-panel)]"}`}>Calendario</button>
          <button onClick={() => setTab("notas")} className={`text-sm px-3 py-1.5 rounded-md transition-colors ${tab === "notas" ? "bg-[var(--accent-dim)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-panel)]"}`}>Notas</button>
          <button onClick={() => { if (tab === "calendario") { setFormEvento((f) => ({ ...f, fechaInicio: diaSeleccionado || new Date().toISOString().slice(0, 16) })); setModalEvento(true); } else setModalNota(true); }} className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#1a1408] font-semibold text-sm rounded-md px-4 py-2 transition-colors">
            <Plus size={15} /> {tab === "calendario" ? "Nuevo evento" : "Nueva nota"}
          </button>
        </div>
      </div>

      {tab === "calendario" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg overflow-hidden">
              {/* Cabecera del mes */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)]">
                <button onClick={() => { if (mes === 0) { setMes(11); setAnio((y) => y - 1); } else setMes((m) => m - 1); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"><ChevronLeft size={18} /></button>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{MESES[mes]} {anio}</span>
                <button onClick={() => { if (mes === 11) { setMes(0); setAnio((y) => y + 1); } else setMes((m) => m + 1); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"><ChevronRight size={18} /></button>
              </div>
              {/* Días de la semana */}
              <div className="grid grid-cols-7 border-b border-[var(--border-subtle)]">
                {DIAS.map((d) => <div key={d} className="py-2 text-center text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{d}</div>)}
              </div>
              {/* Celdas del mes */}
              <div className="grid grid-cols-7">
                {celdas.map((dia, i) => {
                  const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();
                  const evsDia = dia ? eventosDelDia(dia) : [];
                  return (
                    <div key={i} onClick={() => { if (dia) { const f = `${anio}-${String(mes+1).padStart(2,"0")}-${String(dia).padStart(2,"0")}T09:00`; setDiaSeleccionado(f); setFormEvento((prev) => ({ ...prev, fechaInicio: f })); setModalEvento(true); } }} className={`min-h-[72px] p-1.5 border-b border-r border-[var(--border-subtle)] cursor-pointer hover:bg-[var(--bg-panel-raised)] transition-colors ${!dia ? "opacity-0 pointer-events-none" : ""}`}>
                      {dia && (
                        <>
                          <div className={`text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full mb-1 ${esHoy ? "bg-[var(--accent)] text-[#1a1408] font-bold" : "text-[var(--text-secondary)]"}`}>{dia}</div>
                          <div className="space-y-0.5">
                            {evsDia.slice(0, 3).map((ev) => (
                              <div key={ev.id} onClick={(e) => { e.stopPropagation(); setEventoSeleccionado(ev); }} className="text-[10px] px-1 py-0.5 rounded truncate text-white cursor-pointer hover:opacity-80" style={{ backgroundColor: ev.color }}>{ev.titulo}</div>
                            ))}
                            {evsDia.length > 3 && <div className="text-[9px] text-[var(--text-muted)] pl-1">+{evsDia.length - 3} más</div>}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panel derecho: detalle evento o lista de próximos */}
          <div className="col-span-1 space-y-3">
            {eventoSeleccionado ? (
              <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: eventoSeleccionado.color }} />
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{eventoSeleccionado.titulo}</p>
                  </div>
                  <button onClick={() => setEventoSeleccionado(null)}><X size={14} className="text-[var(--text-muted)]" /></button>
                </div>
                <p className="text-xs text-[var(--text-muted)] mb-1">{new Date(eventoSeleccionado.fechaInicio).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                {eventoSeleccionado.descripcion && <p className="text-xs text-[var(--text-secondary)] mb-2">{eventoSeleccionado.descripcion}</p>}
                {eventoSeleccionado.participantes.length > 0 && (
                  <p className="text-xs text-[var(--text-muted)] mb-2">Participantes: {eventoSeleccionado.participantes.map((p) => p.user.nombre).join(", ")}</p>
                )}
                {(me?.userId === eventoSeleccionado.creadoPor.id || me?.role === "ADMIN") && (
                  <button onClick={() => eliminarEvento(eventoSeleccionado.id)} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--status-perdido)] transition-colors"><Trash2 size={12} /> Eliminar evento</button>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Próximos eventos</p>
                {eventos.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-4 text-center">Sin eventos este mes</p>
                ) : (
                  <div className="space-y-2">
                    {eventos.slice(0, 8).map((ev) => (
                      <button key={ev.id} onClick={() => setEventoSeleccionado(ev)} className="w-full text-left bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 hover:border-[var(--accent)] transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                          <p className="text-xs text-[var(--text-primary)] font-medium truncate">{ev.titulo}</p>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5 pl-4">{new Date(ev.fechaInicio).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "notas" && (
        <div>
          {notasPropias.length === 0 && notasCompartidas.length === 0 && !loading && (
            <p className="text-sm text-[var(--text-muted)] bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-4 py-6 text-center">No tienes notas todavía. Crea una con el botón de arriba.</p>
          )}
          {notasPropias.length > 0 && (
            <>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">Mis notas</p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {notasPropias.map((nota) => (
                  <div key={nota.id} className="rounded-lg p-4 border border-[var(--border-subtle)] flex flex-col gap-2" style={{ borderLeftColor: nota.color, borderLeftWidth: 4 }}>
                    {notaEditando?.id === nota.id ? (
                      <>
                        <input value={notaEditando.titulo} onChange={(e) => setNotaEditando({ ...notaEditando, titulo: e.target.value })} className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded px-2 py-1 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors" />
                        <textarea value={notaEditando.contenido} onChange={(e) => setNotaEditando({ ...notaEditando, contenido: e.target.value })} className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded px-2 py-1 text-xs text-[var(--text-secondary)] min-h-[80px] resize-none focus:border-[var(--accent)] transition-colors" />
                        <div className="flex gap-2">
                          <button onClick={() => guardarNota(notaEditando)} className="text-xs bg-[var(--accent)] text-[#1a1408] px-3 py-1 rounded font-semibold">Guardar</button>
                          <button onClick={() => setNotaEditando(null)} className="text-xs text-[var(--text-muted)] px-3 py-1">Cancelar</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{nota.titulo}</p>
                        <p className="text-xs text-[var(--text-secondary)] flex-1 whitespace-pre-wrap">{nota.contenido}</p>
                        {nota.compartidaCon.length > 0 && (
                          <p className="text-[10px] text-[var(--text-muted)]">Compartida con: {nota.compartidaCon.map((c) => c.user.nombre).join(", ")}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => setNotaEditando({ ...nota })} className="text-[10px] text-[var(--accent)] hover:underline">Editar</button>
                          <button onClick={() => { setModalCompartir(nota); setCompartirIds(nota.compartidaCon.map((c) => c.user.id)); }} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] flex items-center gap-0.5"><Share2 size={10} /> Compartir</button>
                          <button onClick={() => eliminarNota(nota.id)} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--status-perdido)] flex items-center gap-0.5 ml-auto"><Trash2 size={10} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          {notasCompartidas.length > 0 && (
            <>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">Compartidas conmigo</p>
              <div className="grid grid-cols-3 gap-4">
                {notasCompartidas.map((nota) => (
                  <div key={nota.id} className="rounded-lg p-4 border border-[var(--border-subtle)]" style={{ borderLeftColor: nota.color, borderLeftWidth: 4 }}>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{nota.titulo}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">{nota.contenido}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-2">De: {nota.autor?.nombre}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal nuevo evento */}
      {modalEvento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg uppercase tracking-wide text-[var(--text-primary)]">Nuevo evento</h2>
              <button onClick={() => setModalEvento(false)}><X size={18} className="text-[var(--text-muted)]" /></button>
            </div>
            <form onSubmit={crearEvento} className="space-y-3">
              <input required value={formEvento.titulo} onChange={(e) => setFormEvento((f) => ({ ...f, titulo: e.target.value }))} placeholder="Título del evento" className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors" />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-[var(--text-muted)] mb-1">Inicio</label><input required type="datetime-local" value={formEvento.fechaInicio} onChange={(e) => setFormEvento((f) => ({ ...f, fechaInicio: e.target.value }))} className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors" /></div>
                <div><label className="block text-xs text-[var(--text-muted)] mb-1">Fin (opcional)</label><input type="datetime-local" value={formEvento.fechaFin} onChange={(e) => setFormEvento((f) => ({ ...f, fechaFin: e.target.value }))} className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors" /></div>
              </div>
              <textarea value={formEvento.descripcion} onChange={(e) => setFormEvento((f) => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción (opcional)" className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] min-h-[60px] resize-none focus:border-[var(--accent)] transition-colors" />
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Color</label>
                <div className="flex gap-2">{COLORES.map((c) => <button key={c} type="button" onClick={() => setFormEvento((f) => ({ ...f, color: c }))} className={`w-6 h-6 rounded-full border-2 transition-all ${formEvento.color === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />)}</div>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Participantes</label>
                <div className="max-h-32 overflow-y-auto space-y-1 border border-[var(--border-subtle)] rounded-md p-2">
                  {usuarios.filter((u) => u.id !== me?.userId).map((u) => (
                    <label key={u.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-[var(--bg-panel-raised)] cursor-pointer">
                      <input type="checkbox" checked={formEvento.participantesIds.includes(u.id)} onChange={() => setFormEvento((f) => ({ ...f, participantesIds: f.participantesIds.includes(u.id) ? f.participantesIds.filter((id) => id !== u.id) : [...f.participantesIds, u.id] }))} className="accent-[var(--accent)]" />
                      <span className="text-xs text-[var(--text-primary)]">{u.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={guardando} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-sm rounded-md py-2.5 transition-colors">{guardando ? "Creando..." : "Crear evento"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal nueva nota */}
      {modalNota && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><StickyNote size={16} style={{ color: "var(--accent)" }} /><h2 className="font-display text-lg uppercase tracking-wide text-[var(--text-primary)]">Nueva nota</h2></div>
              <button onClick={() => setModalNota(false)}><X size={18} className="text-[var(--text-muted)]" /></button>
            </div>
            <form onSubmit={crearNota} className="space-y-3">
              <input required value={formNota.titulo} onChange={(e) => setFormNota((f) => ({ ...f, titulo: e.target.value }))} placeholder="Título" className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors" />
              <textarea required value={formNota.contenido} onChange={(e) => setFormNota((f) => ({ ...f, contenido: e.target.value }))} placeholder="Escribe tu nota aquí..." className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] min-h-[120px] resize-none focus:border-[var(--accent)] transition-colors" />
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Color</label>
                <div className="flex gap-2">{COLORES.map((c) => <button key={c} type="button" onClick={() => setFormNota((f) => ({ ...f, color: c }))} className={`w-6 h-6 rounded-full border-2 transition-all ${formNota.color === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />)}</div>
              </div>
              <button type="submit" disabled={guardando} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-sm rounded-md py-2.5 transition-colors">{guardando ? "Creando..." : "Crear nota"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal compartir nota */}
      {modalCompartir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg uppercase tracking-wide text-[var(--text-primary)]">Compartir nota</h2>
              <button onClick={() => setModalCompartir(null)}><X size={18} className="text-[var(--text-muted)]" /></button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 border border-[var(--border-subtle)] rounded-md p-2 mb-4">
              {usuarios.filter((u) => u.id !== me?.userId).map((u) => (
                <label key={u.id} className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-[var(--bg-panel-raised)] cursor-pointer">
                  <input type="checkbox" checked={compartirIds.includes(u.id)} onChange={() => setCompartirIds((prev) => prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id])} className="accent-[var(--accent)]" />
                  <span className="text-sm text-[var(--text-primary)]">{u.nombre}</span>
                </label>
              ))}
            </div>
            <button onClick={compartirNota} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#1a1408] font-semibold text-sm rounded-md py-2.5 transition-colors">Guardar</button>
          </div>
        </div>
      )}
    </div>
  );
}
