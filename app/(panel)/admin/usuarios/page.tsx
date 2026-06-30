"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, UserPlus, ShieldCheck, ShieldOff } from "lucide-react";
import toast from "react-hot-toast";
import { ROLES } from "@/lib/constants";

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  role: "ADMIN" | "OPERADOR";
  activo: boolean;
  createdAt: string;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    role: "OPERADOR",
  });

  const cargarUsuarios = useCallback(async () => {
    const res = await fetch("/api/usuarios");
    const data = await res.json();
    if (res.ok) setUsuarios(data.usuarios);
    setLoading(false);
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      const res = await fetch("/api/usuarios");
      const data = await res.json();
      if (!activo) return;
      if (res.ok) setUsuarios(data.usuarios);
      setLoading(false);
    })();
    return () => {
      activo = false;
    };
  }, []);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setCreando(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al crear el usuario");
      } else {
        toast.success("Usuario creado correctamente");
        setForm({ nombre: "", email: "", password: "", role: "OPERADOR" });
        setMostrarForm(false);
        cargarUsuarios();
      }
    } finally {
      setCreando(false);
    }
  }

  async function toggleActivo(usuario: Usuario) {
    const res = await fetch(`/api/usuarios/${usuario.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !usuario.activo }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Error al actualizar el usuario");
    } else {
      toast.success(usuario.activo ? "Usuario desactivado" : "Usuario activado");
      cargarUsuarios();
    }
  }

  if (loading) {
    return <div className="p-8 text-[var(--text-secondary)]">Cargando...</div>;
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <Users size={20} style={{ color: "var(--accent)" }} />
          <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)]">
            Usuarios
          </h1>
        </div>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#1a1408] font-semibold text-sm rounded-md px-4 py-2 transition-colors"
        >
          <UserPlus size={15} />
          Añadir usuario
        </button>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Gestiona quién tiene acceso al panel de envíos.
      </p>

      {mostrarForm && (
        <form
          onSubmit={handleCrear}
          className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-5 mb-6 grid grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Nombre
            </label>
            <input
              required
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Email
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Contraseña (mín. 8 caracteres)
            </label>
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Rol
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
            >
              <option value="OPERADOR">Operador</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              disabled={creando}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-sm rounded-md px-4 py-2 transition-colors"
            >
              {creando ? "Creando..." : "Crear usuario"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg divide-y divide-[var(--border-subtle)]">
        {usuarios.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm text-[var(--text-primary)] font-medium">
                {u.nombre}{" "}
                {!u.activo && (
                  <span className="text-xs text-[var(--text-muted)]">(inactivo)</span>
                )}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {u.email} · {ROLES[u.role]}
              </p>
            </div>
            <button
              onClick={() => toggleActivo(u)}
              className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {u.activo ? (
                <>
                  <ShieldOff size={14} /> Desactivar
                </>
              ) : (
                <>
                  <ShieldCheck size={14} /> Activar
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
