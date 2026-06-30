"use client";

import { useEffect, useState } from "react";
import { KeyRound, UserCircle } from "lucide-react";
import toast from "react-hot-toast";

interface SessionUser {
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

  useEffect(() => {
    let activo = true;
    (async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (activo) setUser(data.user);
    })();
    return () => {
      activo = false;
    };
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
