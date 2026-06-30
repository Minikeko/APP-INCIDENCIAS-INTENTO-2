"use client";

import { useEffect, useState } from "react";
import { Eye, Users as UsersIcon } from "lucide-react";

interface Participante {
  user: { id: string; nombre: string };
}

interface ChatResumen {
  id: string;
  tipo: "PRIVADO" | "GRUPAL";
  nombre: string | null;
  participantes: Participante[];
  mensajes: { texto: string; createdAt: string }[];
  _count: { mensajes: number };
}

interface Mensaje {
  id: string;
  texto: string;
  createdAt: string;
  autor: { id: string; nombre: string };
}

export default function SupervisionChatsPage() {
  const [chats, setChats] = useState<ChatResumen[]>([]);
  const [chatActivoId, setChatActivoId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [participantesActivo, setParticipantesActivo] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargandoChat, setCargandoChat] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      const res = await fetch("/api/admin/chats");
      const data = await res.json();
      if (!activo) return;
      if (res.ok) setChats(data.chats);
      setLoading(false);
    })();
    return () => {
      activo = false;
    };
  }, []);

  async function abrirChat(id: string) {
    setChatActivoId(id);
    setCargandoChat(true);
    const res = await fetch(`/api/admin/chats/${id}`);
    const data = await res.json();
    if (res.ok) {
      setMensajes(data.chat.mensajes);
      setParticipantesActivo(data.chat.participantes);
    }
    setCargandoChat(false);
  }

  function nombreDeChat(chat: ChatResumen): string {
    if (chat.tipo === "GRUPAL") {
      return chat.nombre || chat.participantes.map((p) => p.user.nombre).join(", ");
    }
    return chat.participantes.map((p) => p.user.nombre).join(" / ");
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-2.5 mb-1">
        <Eye size={20} style={{ color: "var(--accent)" }} />
        <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)]">
          Supervisión de chats
        </h1>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Acceso de administrador a todas las conversaciones del equipo.
      </p>

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Cargando...</p>
      ) : chats.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-4 py-6 text-center">
          No hay chats creados todavía.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg divide-y divide-[var(--border-subtle)] max-h-[600px] overflow-y-auto">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => abrirChat(chat.id)}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  chatActivoId === chat.id
                    ? "bg-[var(--accent-dim)]"
                    : "hover:bg-[var(--bg-panel-raised)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  {chat.tipo === "GRUPAL" && (
                    <UsersIcon size={12} className="text-[var(--text-muted)] shrink-0" />
                  )}
                  <p className="text-sm text-[var(--text-primary)] font-medium truncate">
                    {nombreDeChat(chat)}
                  </p>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {chat._count.mensajes} mensaje(s)
                </p>
              </button>
            ))}
          </div>

          <div className="col-span-2 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5 max-h-[600px] overflow-y-auto">
            {!chatActivoId ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-12">
                Selecciona un chat para ver los mensajes
              </p>
            ) : cargandoChat ? (
              <p className="text-sm text-[var(--text-secondary)]">Cargando...</p>
            ) : (
              <>
                <p className="text-xs text-[var(--text-muted)] mb-4">
                  Participantes: {participantesActivo.map((p) => p.user.nombre).join(", ")}
                </p>
                <div className="space-y-3">
                  {mensajes.map((m) => (
                    <div key={m.id} className="text-sm border-l-2 border-[var(--border-strong)] pl-3">
                      <p className="text-[var(--text-primary)]">{m.texto}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {m.autor.nombre} ·{" "}
                        {new Date(m.createdAt).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))}
                  {mensajes.length === 0 && (
                    <p className="text-sm text-[var(--text-muted)]">Sin mensajes todavía.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
