"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  MessageSquare,
  Plus,
  Send,
  Users as UsersIcon,
  X,
  Trash2,
  Smile,
  Check,
  CheckCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { EmojiPickerPropio } from "@/components/EmojiPicker";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  role: string;
}

interface Participante {
  user: { id: string; nombre: string };
}

interface ChatResumen {
  id: string;
  tipo: "PRIVADO" | "GRUPAL";
  nombre: string | null;
  participantes: Participante[];
  mensajes: { texto: string; createdAt: string }[];
}

interface Mensaje {
  id: string;
  texto: string;
  createdAt: string;
  autor: { id: string; nombre: string };
  vistosPor: string[];
}

interface SesionUser {
  userId: string;
  nombre: string;
  role: string;
}

const POLLING_INTERVAL_MS = 3500;

export default function ChatsPage() {
  const [me, setMe] = useState<SesionUser | null>(null);
  const [chats, setChats] = useState<ChatResumen[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [chatActivoId, setChatActivoId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [textoMensaje, setTextoMensaje] = useState("");
  const [mostrarNuevoChat, setMostrarNuevoChat] = useState(false);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [loading, setLoading] = useState(true);

  const ultimaFechaRef = useRef<string | null>(null);
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carga inicial
  useEffect(() => {
    let activo = true;
    (async () => {
      const [meRes, usuariosRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/usuarios"),
      ]);
      const meData = await meRes.json();
      const usuariosData = await usuariosRes.json();
      if (!activo) return;
      setMe(meData.user);
      setUsuarios((usuariosData.usuarios || []).filter((u: Usuario) => u.activo));
      setLoading(false);
    })();
    return () => { activo = false; };
  }, []);

  const cargarChats = useCallback(async () => {
    const res = await fetch("/api/chats");
    const data = await res.json();
    if (res.ok) setChats(data.chats);
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      const res = await fetch("/api/chats");
      const data = await res.json();
      if (activo && res.ok) setChats(data.chats);
    })();
    const interval = setInterval(() => { void cargarChats(); }, POLLING_INTERVAL_MS);
    return () => { activo = false; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling de mensajes del chat activo
  useEffect(() => {
    if (!chatActivoId) return;
    let activo = true;
    ultimaFechaRef.current = null;

    async function cargarMensajes(esPrimeraCarga: boolean) {
      const params = ultimaFechaRef.current
        ? `?despues=${encodeURIComponent(ultimaFechaRef.current)}`
        : "";
      const res = await fetch(`/api/chats/${chatActivoId}/mensajes${params}`);
      const data = await res.json();
      if (!activo || !res.ok) return;
      if (esPrimeraCarga) {
        setMensajes(data.mensajes);
      } else if (data.mensajes.length > 0) {
        setMensajes((prev) => {
          // Actualizar vistosPor de mensajes existentes + añadir nuevos
          const idsExistentes = new Set(prev.map((m) => m.id));
          const nuevos = data.mensajes.filter((m: Mensaje) => !idsExistentes.has(m.id));
          const actualizados = prev.map((m) => {
            const actualizado = data.mensajes.find((nm: Mensaje) => nm.id === m.id);
            return actualizado || m;
          });
          return [...actualizados, ...nuevos];
        });
      }
      if (data.mensajes.length > 0) {
        ultimaFechaRef.current = data.mensajes[data.mensajes.length - 1].createdAt;
      }
    }

    void cargarMensajes(true);
    const interval = setInterval(() => cargarMensajes(false), POLLING_INTERVAL_MS);
    return () => { activo = false; clearInterval(interval); };
  }, [chatActivoId]);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  async function handleEnviarMensaje(e: React.FormEvent) {
    e.preventDefault();
    if (!textoMensaje.trim() || !chatActivoId) return;
    const texto = textoMensaje;
    setTextoMensaje("");
    setMostrarEmojis(false);
    try {
      const res = await fetch(`/api/chats/${chatActivoId}/mensajes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensajes((prev) => [...prev, data.mensaje]);
        ultimaFechaRef.current = data.mensaje.createdAt;
        cargarChats();
      } else {
        toast.error(data.error || "Error al enviar el mensaje");
      }
    } catch {
      toast.error("Error de conexión");
    }
  }

  async function handleCrearChat(e: React.FormEvent) {
    e.preventDefault();
    if (seleccionados.length === 0) {
      toast.error("Selecciona al menos una persona");
      return;
    }
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantesIds: seleccionados,
          nombre: seleccionados.length > 1 ? nombreGrupo : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al crear el chat");
        return;
      }
      setMostrarNuevoChat(false);
      setSeleccionados([]);
      setNombreGrupo("");
      await cargarChats();
      setChatActivoId(data.chat.id);
    } catch {
      toast.error("Error de conexión");
    }
  }

  async function handleEliminarChat(chatId: string) {
    if (!confirm("¿Eliminar este chat y todos sus mensajes?")) return;
    const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Chat eliminado");
      if (chatActivoId === chatId) {
        setChatActivoId(null);
        setMensajes([]);
      }
      cargarChats();
    } else {
      toast.error("Error al eliminar el chat");
    }
  }

  function nombreDeChat(chat: ChatResumen): string {
    if (chat.tipo === "GRUPAL") {
      return chat.nombre || chat.participantes.map((p) => p.user.nombre).join(", ");
    }
    const otro = chat.participantes.find((p) => p.user.id !== me?.userId);
    return otro?.user.nombre || "Chat";
  }

  function toggleSeleccionado(userId: string) {
    setSeleccionados((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  // ✓✓: todos los participantes del chat (excepto el autor) han visto el mensaje
  function mensajeLeido(mensaje: Mensaje, chatActivo: ChatResumen): boolean {
    if (mensaje.autor.id !== me?.userId) return false;
    const otrosParticipantes = chatActivo.participantes
      .map((p) => p.user.id)
      .filter((id) => id !== me?.userId);
    return otrosParticipantes.every((id) => mensaje.vistosPor.includes(id));
  }

  const esAdmin = me?.role === "ADMIN";

  if (loading) {
    return <div className="p-8 text-[var(--text-secondary)]">Cargando...</div>;
  }

  const chatActivo = chats.find((c) => c.id === chatActivoId);

  return (
    <div className="flex h-screen">
      {/* Lista de chats */}
      <div className="w-80 border-r border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-col">
        <div className="px-5 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} style={{ color: "var(--accent)" }} />
            <h1 className="font-display text-lg uppercase tracking-wide text-[var(--text-primary)]">
              Chats
            </h1>
          </div>
          <button
            onClick={() => setMostrarNuevoChat(true)}
            className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] px-5 py-6 text-center">
              Todavía no tienes ningún chat.
            </p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center border-b border-[var(--border-subtle)] transition-colors ${
                  chatActivoId === chat.id
                    ? "bg-[var(--accent-dim)]"
                    : "hover:bg-[var(--bg-panel-raised)]"
                }`}
              >
                <button
                  onClick={() => setChatActivoId(chat.id)}
                  className="flex-1 text-left px-4 py-3 min-w-0"
                >
                  <div className="flex items-center gap-2">
                    {chat.tipo === "GRUPAL" && (
                      <UsersIcon size={13} className="text-[var(--text-muted)] shrink-0" />
                    )}
                    <p className="text-sm text-[var(--text-primary)] font-medium truncate">
                      {nombreDeChat(chat)}
                    </p>
                  </div>
                  {chat.mensajes[0] && (
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                      {chat.mensajes[0].texto}
                    </p>
                  )}
                </button>
                {esAdmin && (
                  <button
                    onClick={() => handleEliminarChat(chat.id)}
                    className="shrink-0 pr-3 opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--status-perdido)] transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conversación activa */}
      <div className="flex-1 flex flex-col bg-[var(--bg-base)]">
        {!chatActivo ? (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
            Selecciona un chat o crea uno nuevo
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {nombreDeChat(chatActivo)}
              </p>
              {chatActivo.tipo === "GRUPAL" && (
                <p className="text-xs text-[var(--text-muted)]">
                  {chatActivo.participantes.map((p) => p.user.nombre).join(", ")}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {mensajes.map((m) => {
                const esMio = m.autor.id === me?.userId;
                const leido = mensajeLeido(m, chatActivo);
                return (
                  <div key={m.id} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[65%] rounded-lg px-3.5 py-2 text-sm ${
                        esMio
                          ? "bg-[var(--accent)] text-[#1a1408]"
                          : "bg-[var(--bg-panel)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                      }`}
                    >
                      {!esMio && chatActivo.tipo === "GRUPAL" && (
                        <p className="text-xs font-semibold mb-0.5 opacity-70">{m.autor.nombre}</p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                      <div className={`flex items-center gap-1 mt-1 ${esMio ? "justify-end" : ""}`}>
                        <p className={`text-[10px] ${esMio ? "opacity-60" : "text-[var(--text-muted)]"}`}>
                          {new Date(m.createdAt).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {esMio && (
                          leido
                            ? <CheckCheck size={12} className="opacity-80" />
                            : <Check size={12} className="opacity-50" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={mensajesEndRef} />
            </div>

            {/* Selector de emojis */}
            <div className="relative px-6">
              {mostrarEmojis && (
                <EmojiPickerPropio
                  onSelect={(emoji) => {
                    setTextoMensaje((prev) => prev + emoji);
                    inputRef.current?.focus();
                  }}
                  onClose={() => setMostrarEmojis(false)}
                />
              )}
            </div>

            <form
              onSubmit={handleEnviarMensaje}
              className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)] flex gap-2 items-center"
            >
              <button
                type="button"
                onClick={() => setMostrarEmojis((v) => !v)}
                className={`shrink-0 transition-colors ${
                  mostrarEmojis
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Smile size={20} />
              </button>
              <input
                ref={inputRef}
                value={textoMensaje}
                onChange={(e) => setTextoMensaje(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors"
              />
              <button
                type="submit"
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#1a1408] rounded-md px-4 py-2 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>

      {/* Modal nuevo chat */}
      {mostrarNuevoChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg uppercase tracking-wide text-[var(--text-primary)]">
                Nuevo chat
              </h2>
              <button
                onClick={() => setMostrarNuevoChat(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCrearChat} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Selecciona participantes
                </label>
                <div className="max-h-56 overflow-y-auto space-y-1 border border-[var(--border-subtle)] rounded-md p-2">
                  {usuarios
                    .filter((u) => u.id !== me?.userId)
                    .map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-[var(--bg-panel-raised)] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={seleccionados.includes(u.id)}
                          onChange={() => toggleSeleccionado(u.id)}
                          className="accent-[var(--accent)]"
                        />
                        <span className="text-sm text-[var(--text-primary)]">{u.nombre}</span>
                      </label>
                    ))}
                </div>
              </div>

              {seleccionados.length > 1 && (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Nombre del grupo (opcional)
                  </label>
                  <input
                    value={nombreGrupo}
                    onChange={(e) => setNombreGrupo(e.target.value)}
                    className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
                    placeholder="Ej. Equipo logística"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#1a1408] font-semibold text-sm rounded-md py-2.5 transition-colors"
              >
                Crear chat
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
