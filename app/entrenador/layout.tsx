"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  CalendarDays,
  CheckSquare,
  BarChart2,
  LogOut,
  Settings,
  Bell,
  Users,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";

const NAV_ITEMS = [
  { href: "/entrenador/agenda", label: "Planificador", icon: CalendarDays },
  { href: "/entrenador/cumplimiento", label: "Cumplimiento", icon: CheckSquare },
  { href: "/entrenador/informes", label: "Informes", icon: BarChart2 },
];

export default function EntrenadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { usuarioActivo, logout, loadingAuth } = useAppContext();

  useEffect(() => {
    if (!loadingAuth && usuarioActivo !== null && usuarioActivo.tipo !== "staff") {
      router.replace("/login");
    }
  }, [usuarioActivo, loadingAuth, router]);

  if (loadingAuth) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-6 h-6 rounded-full border-2 border-primary-container border-t-transparent animate-spin" />
    </div>
  );
  if (!usuarioActivo || usuarioActivo.tipo !== "staff") return null;

  function handleLogout() {
    logout(); // logout navega a /login internamente
  }

  const rolLabel =
    usuarioActivo.rol === "head_coach" ? "HEAD COACH" : "ENTRENADOR";

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Top Header ───────────────────────────────────────── */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-[20px] h-16 bg-surface border-b border-outline-variant">
        <h1
          className="font-inter font-black text-xl text-primary"
          style={{ letterSpacing: "-0.02em" }}
        >
          RUGBY<span className="text-primary-container">PERF</span>
        </h1>
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <Bell size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center">
              <span className="font-jetbrains text-[10px] font-bold text-on-surface-variant">
                {usuarioActivo.iniciales}
              </span>
            </div>
            <div className="hidden md:block text-right">
              <p className="font-inter text-xs font-semibold text-on-surface leading-none">
                {usuarioActivo.nombre.split(" ")[0]}
              </p>
              <p className="font-jetbrains text-[9px] text-primary-container tracking-wider">
                {rolLabel}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Side Nav (desktop) ───────────────────────────────── */}
      <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 pt-16 bg-surface-container-low border-r border-outline-variant w-64 z-40">
        <div className="px-6 py-6 border-b border-outline-variant">
          <p className="font-jetbrains text-[10px] tracking-[0.15em] text-on-surface-variant uppercase mb-1">
            Staff Dashboard
          </p>
          <p className="font-inter font-bold text-sm text-primary-container tracking-widest uppercase">
            {rolLabel}
          </p>
          <p className="font-inter text-xs text-on-surface-variant mt-0.5">
            {usuarioActivo.nombre}
          </p>
        </div>

        <nav className="flex-1 py-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-6 py-3.5 font-jetbrains text-[11px] tracking-widest transition-all duration-150 ${
                  active
                    ? "text-primary border-r-2 border-primary-container bg-surface-container-high font-bold"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <Icon size={16} />
                {label.toUpperCase()}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 pb-4 border-t border-outline-variant pt-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-0 py-2.5 font-jetbrains text-[11px] tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">
            <Settings size={16} />
            CONFIGURACIÓN
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-0 py-2.5 font-jetbrains text-[11px] tracking-widest text-error hover:opacity-80 transition-colors"
          >
            <LogOut size={16} />
            CERRAR SESIÓN
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="md:ml-64 mt-16 min-h-[calc(100vh-4rem)] pb-24 md:pb-0">
        {children}
      </main>

      {/* ── Bottom Nav (mobile) ───────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-2 pb-5 bg-surface-container border-t border-outline-variant rounded-t-xl shadow-lg">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all active:scale-95 ${
                active
                  ? "bg-primary-container text-on-primary-fixed"
                  : "text-on-surface-variant"
              }`}
            >
              <Icon size={20} />
              <span className="font-jetbrains text-[10px] mt-0.5 tracking-wider">
                {label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center px-4 py-1.5 rounded-xl text-on-surface-variant active:scale-95 transition-all"
        >
          <Users size={20} />
          <span className="font-jetbrains text-[10px] mt-0.5 tracking-wider">
            Salir
          </span>
        </button>
      </nav>
    </div>
  );
}
