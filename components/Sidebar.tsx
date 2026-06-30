"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PackageSearch,
  LayoutGrid,
  PlusCircle,
  BellRing,
  FileBarChart,
  Users,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";

interface SessionUser {
  userId: string;
  email: string;
  nombre: string;
  role: "ADMIN" | "OPERADOR";
}

const NAV_ITEMS = [
  { href: "/", label: "Envíos", icon: LayoutGrid },
  { href: "/envios/nuevo", label: "Nuevo envío", icon: PlusCircle },
  { href: "/alertas", label: "Alertas", icon: BellRing },
  { href: "/informes", label: "Informes", icon: FileBarChart },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 bg-[var(--bg-panel)] border-r border-[var(--border-subtle)] flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <PackageSearch size={20} style={{ color: "var(--accent)" }} />
          <span className="font-display text-base tracking-wide text-[var(--text-primary)] uppercase">
            Control de Envíos
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-[var(--accent-dim)] text-[var(--accent)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-panel-raised)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}

        {user?.role === "ADMIN" && (
          <Link
            href="/usuarios"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
              pathname.startsWith("/usuarios")
                ? "bg-[var(--accent-dim)] text-[var(--accent)] font-medium"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-panel-raised)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Users size={17} />
            Usuarios
          </Link>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-[var(--border-subtle)]">
        {user && (
          <div className="px-3 mb-3">
            <p className="text-sm text-[var(--text-primary)] font-medium truncate">
              {user.nombre}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate">
              {user.role === "ADMIN" ? "Administrador" : "Operador"}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-panel-raised)] hover:text-[var(--status-perdido)] transition-colors"
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
