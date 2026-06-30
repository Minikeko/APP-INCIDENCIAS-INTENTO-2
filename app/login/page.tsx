"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { PackageSearch, Lock, Mail } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "No se ha podido iniciar sesión");
        setLoading(false);
        return;
      }
      const dest = searchParams.get("from") || "/";
      router.push(dest);
      router.refresh();
    } catch {
      toast.error("Error de conexión. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <PackageSearch size={22} style={{ color: "var(--accent)" }} />
          <span className="font-display text-xl tracking-wide text-[var(--text-primary)] uppercase">
            Control de Envíos
          </span>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Inicia sesión para acceder al panel de incidencias
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5"
          >
            Correo electrónico
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md pl-9 pr-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors"
              placeholder="tu@empresa.com"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5"
          >
            Contraseña
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md pl-9 pr-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-sm rounded-md py-2.5 mt-2 transition-colors"
        >
          {loading ? "Accediendo..." : "Acceder al panel"}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Panel lateral — identidad visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--bg-panel)] relative overflow-hidden flex-col justify-between p-12 border-r border-[var(--border-subtle)]">
        <div className="absolute inset-0 opacity-[0.04]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, var(--text-primary) 0px, var(--text-primary) 1px, transparent 1px, transparent 32px)",
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <PackageSearch size={20} style={{ color: "var(--accent)" }} />
            <span className="font-display text-sm tracking-[0.2em] text-[var(--text-secondary)] uppercase">
              Control de Envíos
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="font-display text-4xl leading-tight text-[var(--text-primary)] mb-4">
            Cada paquete,
            <br />
            <span style={{ color: "var(--accent)" }}>localizado.</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm max-w-sm leading-relaxed">
            Registra incidencias, sigue el estado de cada envío y mantén a
            todo el equipo sincronizado desde un único panel.
          </p>
        </div>

        <div className="relative z-10 font-mono text-xs text-[var(--text-muted)] space-y-1.5">
          <div className="flex items-center gap-3">
            <span style={{ color: "var(--status-perdido)" }}>●</span>
            <span>ES4471829034 — PERDIDO EN TRÁNSITO</span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: "var(--status-investigacion)" }}>●</span>
            <span>ES4471829112 — EN INVESTIGACIÓN</span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: "var(--status-entregado)" }}>●</span>
            <span>ES4471829205 — ENTREGADO</span>
          </div>
        </div>
      </div>

      {/* Panel de formulario */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--bg-base)]">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
