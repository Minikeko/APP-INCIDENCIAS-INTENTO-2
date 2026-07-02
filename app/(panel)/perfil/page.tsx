"use client";

import { useEffect, useState, useRef } from "react";
import { KeyRound, UserCircle, Camera, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/Avatar";

interface SessionUser {
  userId: string;
  email: string;
  nombre: string;
  role: "ADMIN" | "OPERADOR";
}

export default function PerfilPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (activo) setUser(data.user);
    })();
    return () => { activo = false; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordNueva !== confirmarPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }
    if (passwordNueva.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch("/api/usuarios/cambiar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordActual, passwordNueva }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al cambiar la contraseña");
      } else {
        toast.success("Contraseña actualizada correctamente");
        setPasswordActual("");
        setPasswordNueva("");
        setConfirmarPassword("");
      }
    } finally {
      setGuardando(false);
    }
  }

  async function handleSubirAvatar(file: File) {
    setSubiendoAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/usuario/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al subir la imagen");
      } else {
        toast.success("Foto de perfil actualizada");
        setAvatarKey((k) => k + 1);
      }
    } finally {
      setSubiendoAvatar(false);
    }
  }

  async function handleEliminarAvatar() {
    const res = await fetch("/api/usuario/avatar", { method: "DELETE" });
    if (res.ok) {
      toast.success("Foto de perfil eliminada");
      setAvatarKey((k) => k + 1);
    }
  }

  return (
    <div className="p-8 max-w-md">
      <div className="flex items-center gap-2.5 mb-1">
        <UserCircle size={20} style={{ color: "var(--accent)" }} />
        <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)]">
          Mi perfil
        </h1>
      </div>
      {user && (
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {user.nombre} · {user.email}
        </p>
      )}

      {/* Avatar */}
      {user && (
        <section className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5 mb-4">
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
            Foto de perfil
          </p>
          <div className="flex items-center gap-4">
            <div key={avatarKey}>
              <Avatar userId={user.userId} nombre={user.nombre} size={64} />
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSubirAvatar(file);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={subiendoAvatar}
                className="flex items-center gap-1.5 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-medium rounded-md px-3 py-1.5 transition-colors"
              >
                <Camera size={14} />
                {subiendoAvatar ? "Subiendo..." : "Cambiar foto"}
              </button>
              <button
                onClick={handleEliminarAvatar}
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--status-perdido)] transition-colors"
              >
                <Trash2 size={12} />
                Eliminar foto
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Cambiar contraseña */}
      <section className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={15} style={{ color: "var(--accent)" }} />
          <h2 className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Cambiar contraseña
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Contraseña actual
            </label>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Nueva contraseña
            </label>
            <input
              required
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Confirmar nueva contraseña
            </label>
            <input
              required
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-sm rounded-md py-2.5 transition-colors"
          >
            {guardando ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </form>
      </section>
    </div>
  );
}
