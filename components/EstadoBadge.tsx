import { ESTADOS, EstadoKey } from "@/lib/constants";

export function EstadoBadge({ estado }: { estado: string }) {
  const config = ESTADOS[estado as EstadoKey];
  if (!config) return <span className="text-xs text-[var(--text-muted)]">{estado}</span>;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}
