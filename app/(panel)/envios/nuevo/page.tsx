"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ESTADOS_LIST } from "@/lib/constants";

export default function NuevoEnvioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    numeroSeguimiento: "",
    mensajero: "",
    estado: "EN_TRANSITO",
    motivo: "",
    descripcion: "",
    destinatario: "",
    direccion: "",
    fechaEnvio: "",
    fechaInforme: "",
    responsable: "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/envios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al registrar el envío");
        setLoading(false);
        return;
      }
      toast.success("Envío registrado correctamente");
      router.push(`/envios/${data.envio.id}`);
    } catch {
      toast.error("Error de conexión");
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--text-primary)] mb-1">
        Registrar envío
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Añade un envío con incidencia para empezar a darle seguimiento.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Número de seguimiento" required>
            <input
              required
              value={form.numeroSeguimiento}
              onChange={(e) => update("numeroSeguimiento", e.target.value)}
              className="input font-mono"
              placeholder="ES4471829034"
            />
          </Field>
          <Field label="Mensajero / Transportista" required>
            <input
              required
              value={form.mensajero}
              onChange={(e) => update("mensajero", e.target.value)}
              className="input"
              placeholder="Correos, SEUR, DHL..."
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Estado inicial">
            <select
              value={form.estado}
              onChange={(e) => update("estado", e.target.value)}
              className="input"
            >
              {ESTADOS_LIST.map((e) => (
                <option key={e.key} value={e.key}>
                  {e.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fecha de envío">
            <input
              type="date"
              value={form.fechaEnvio}
              onChange={(e) => update("fechaEnvio", e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Fecha en la que se informa">
          <input
            type="date"
            value={form.fechaInforme}
            onChange={(e) => update("fechaInforme", e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Motivo">
          <input
            value={form.motivo}
            onChange={(e) => update("motivo", e.target.value)}
            className="input"
            placeholder="Ej. Extraviado en tránsito, retraso en aduana..."
          />
        </Field>

        <Field label="Descripción">
          <textarea
            value={form.descripcion}
            onChange={(e) => update("descripcion", e.target.value)}
            className="input min-h-[100px] resize-y"
            placeholder="Detalles de lo ocurrido..."
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Destinatario">
            <input
              value={form.destinatario}
              onChange={(e) => update("destinatario", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Dirección">
            <input
              value={form.direccion}
              onChange={(e) => update("direccion", e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Responsable (quién lleva el caso)">
          <input
            value={form.responsable}
            onChange={(e) => update("responsable", e.target.value)}
            placeholder="Nombre del responsable (opcional)"
            className="input"
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[#1a1408] font-semibold text-sm rounded-md px-5 py-2.5 transition-colors"
          >
            {loading ? "Guardando..." : "Registrar envío"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm px-5 py-2.5 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>

      <style jsx global>{`
        .input {
          width: 100%;
          background: var(--bg-panel-raised);
          border: 1px solid var(--border-strong);
          border-radius: 0.375rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        .input:focus {
          border-color: var(--accent);
          outline: none;
        }
        .input::placeholder {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
        {label} {required && <span style={{ color: "var(--accent)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}
