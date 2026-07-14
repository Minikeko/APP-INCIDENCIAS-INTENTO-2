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
  ShieldCheck,
  Receipt,
  FileSpreadsheet,
  History,
  BarChart3,
  MessageSquare,
  ScrollText,
  Wallet,
  Kanban,
  Bell,
  Sun,
  Moon,
  X,
  CalendarDays,
  FileText,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { Avatar } from "@/components/Avatar";

interface SessionUser {
  userId: string;
  email: string;
  nombre: string;
  role: "ADMIN" | "OPERADOR";
}

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string;
  leida: boolean;
  url: string | null;
  createdAt: string;
}

const NAV_ITEMS = [
  { href: "/", label: "Envíos", icon: LayoutGrid },
  { href: "/tablero", label: "Tablero", icon: Kanban },
  { href: "/envios/nuevo", label: "Nuevo envío", icon: PlusCircle },
  { href: "/alertas", label: "Alertas", icon: BellRing },
  { href: "/informes", label: "Informes", icon: FileBarChart },
  { href: "/chats", label: "Chats", icon: MessageSquare },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
];

const ADMIN_ITEMS = [
  { href: "/admin/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/tarifas", label: "Tarifas de comerciales", icon: FileSpreadsheet },
  { href: "/admin/facturacion", label: "Facturación", icon: Receipt },
  { href: "/admin/facturas-manuales", label: "Facturas manuales", icon: FileText },
  { href: "/admin/denuncias", label: "Denuncias", icon: ScrollText },
  { href: "/admin/gastos", label: "Gastos varios", icon: Wallet },
  { href: "/admin/excel", label: "Archivos Excel", icon: FileSpreadsheet },
  { href: "/admin/actividad", label: "Registro de actividad", icon: History },
];

const POLLING_NOTIF = 15000;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [totalNoLeidas, setTotalNoLeidas] = useState(0);
  const [mostrarNotif, setMostrarNotif] = useState(false);
  const [campanaPos, setCampanaPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const campanaRef = useRef<HTMLButtonElement>(null);
  const [tema, setTema] = useState<"dark" | "light">("dark");

  useEffect(() => {
    let activo = true;
    (async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (activo && data.user) setUser(data.user);
    })();
    return () => { activo = false; };
  }, []);

  // Cargar preferencias (tema)
  useEffect(() => {
    let activo = true;
    (async () => {
      const res = await fetch("/api/preferencias");
      const data = await res.json();
      if (activo && data.tema) {
        setTema(data.tema);
        aplicarTema(data.tema);
      }
    })();
    return () => { activo = false; };
  }, []);

  function aplicarTema(t: "dark" | "light") {
    document.documentElement.setAttribute("data-theme", t);
  }

  async function toggleTema() {
    const nuevoTema = tema === "dark" ? "light" : "dark";
    setTema(nuevoTema);
    aplicarTema(nuevoTema);
    await fetch("/api/preferencias", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tema: nuevoTema }),
    });
  }

  const cargarNotificaciones = useCallback(async () => {
    const res = await fetch("/api/notificaciones");
    const data = await res.json();
    if (res.ok) {
      setNotificaciones(data.notificaciones);
      setTotalNoLeidas(data.totalNoLeidas);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      const res = await fetch("/api/notificaciones");
      const data = await res.json();
      if (activo && res.ok) {
        setNotificaciones(data.notificaciones);
        setTotalNoLeidas(data.totalNoLeidas);
      }
    })();
    const interval = setInterval(() => void cargarNotificaciones(), POLLING_NOTIF);
    return () => { activo = false; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function marcarLeida(id?: string) {
    await fetch("/api/notificaciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : {}),
    });
    cargarNotificaciones();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 bg-[var(--bg-panel)] border-r border-[var(--border-subtle)] flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="px-5 py-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PackageSearch size={20} style={{ color: "var(--accent)" }} />
            <span className="font-display text-base tracking-wide text-[var(--text-primary)] uppercase">
              Control de Envíos
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Toggle tema */}
            <button
              onClick={toggleTema}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title={tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {tema === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {/* Campana de notificaciones */}
            <div className="relative">
              <button
                onClick={() => {
                  if (campanaRef.current) {
                    const rect = campanaRef.current.getBoundingClientRect();
                    setCampanaPos({ top: rect.top, left: rect.left, width: rect.width });
                  }
                  setMostrarNotif((v) => !v);
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors relative"
              >
                <Bell size={16} />
                {totalNoLeidas > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[var(--status-perdido)] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {totalNoLeidas > 9 ? "9+" : totalNoLeidas}
                  </span>
                )}
              </button>

              {mostrarNotif && campanaPos && (
                <div
                  className="fixed z-50 w-80 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl shadow-2xl overflow-hidden"
                  style={{
                    top: campanaPos.top,
                    left: campanaPos.left + campanaPos.width + 12,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Notificaciones</span>
                    <div className="flex items-center gap-2">
                      {totalNoLeidas > 0 && (
                        <button
                          onClick={() => marcarLeida()}
                          className="text-xs text-[var(--accent)] hover:underline"
                        >
                          Marcar todas leídas
                        </button>
                      )}
                      <button onClick={() => setMostrarNotif(false)}>
                        <X size={14} className="text-[var(--text-muted)]" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificaciones.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)] text-center py-6">
                        Sin notificaciones
                      </p>
                    ) : (
                      notificaciones.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            marcarLeida(n.id);
                            if (n.url) {
                              router.push(n.url);
                              setMostrarNotif(false);
                            }
                          }}
                          className={`px-4 py-3 border-b border-[var(--border-subtle)] cursor-pointer transition-colors hover:bg-[var(--bg-panel-raised)] ${
                            !n.leida ? "bg-[var(--accent-dim)]" : ""
                          }`}
                        >
                          <p className="text-xs font-semibold text-[var(--text-primary)]">{n.titulo}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{n.cuerpo}</p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-1">
                            {new Date(n.createdAt).toLocaleString("es-ES", {
                              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <Link
                    href="/notificaciones"
                    onClick={() => setMostrarNotif(false)}
                    className="block text-center text-xs text-[var(--accent)] py-2.5 hover:bg-[var(--bg-panel-raised)] transition-colors"
                  >
                    Ver historial completo
                  </Link>
                </div>
                )}
            </div>
          </div>
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
          <div className="pt-5 mt-4 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5 px-3 mb-2">
              <ShieldCheck size={13} className="text-[var(--text-muted)]" />
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
                Administración
              </span>
            </div>
            {ADMIN_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
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
          </div>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-[var(--border-subtle)]">
        {user && (
          <Link
            href="/perfil"
            className={`flex items-center gap-3 px-3 py-2 mb-1 rounded-md transition-colors ${
              pathname.startsWith("/perfil")
                ? "bg-[var(--accent-dim)]"
                : "hover:bg-[var(--bg-panel-raised)]"
            }`}
          >
            <Avatar userId={user.userId} nombre={user.nombre} size={32} />
            <div className="min-w-0">
              <p className="text-sm text-[var(--text-primary)] font-medium truncate">
                {user.nombre}
              </p>
              <p className="text-xs text-[var(--text-muted)] truncate">
                {user.role === "ADMIN" ? "Administrador" : "Operador"} · Editar perfil
              </p>
            </div>
          </Link>
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
