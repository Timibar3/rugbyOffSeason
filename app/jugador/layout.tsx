"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { CalendarDays, TrendingUp, LogOut } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

export default function JugadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { usuarioActivo, logout, loadingAuth } = useAppContext();

  useEffect(() => {
    if (!loadingAuth && usuarioActivo !== null && usuarioActivo.tipo !== "jugador") {
      router.replace("/login");
    }
  }, [usuarioActivo, loadingAuth, router]);

  if (loadingAuth) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-6 h-6 rounded-full border-2 border-primary-container border-t-transparent animate-spin" />
    </div>
  );
  if (!usuarioActivo || usuarioActivo.tipo !== "jugador") return null;

  function handleLogout() {
    logout();
  }

  const posDisplay =
    usuarioActivo.posiciones.length > 1
      ? `${usuarioActivo.posiciones[0]} · +${usuarioActivo.posiciones.length - 1}`
      : usuarioActivo.posiciones[0];

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-[20px] h-16 bg-surface border-b border-outline-variant">
        <h1
          className="font-inter font-black text-xl text-primary"
          style={{ letterSpacing: "-0.02em" }}
        >
          RUGBY<span className="text-primary-container">PERF</span>
        </h1>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-inter text-xs font-semibold text-on-surface leading-none">
              {usuarioActivo.nombre.split(" ")[0].toUpperCase()}
            </p>
            <p className="font-jetbrains text-[9px] text-on-surface-variant tracking-wider mt-0.5">
              #{usuarioActivo.numero} · {posDisplay}
            </p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="w-8 h-8 rounded border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-error hover:border-error transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────── */}
      <main className="pt-16 pb-24 flex-1">{children}</main>

      {/* ── Bottom Nav ───────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-2 pb-5 bg-surface-container border-t border-outline-variant rounded-t-xl shadow-lg">
        <Link
          href="/jugador/agenda"
          className={`flex flex-col items-center justify-center px-8 py-1.5 rounded-xl transition-all active:scale-95 ${
            pathname === "/jugador/agenda"
              ? "bg-primary-container text-on-primary-fixed"
              : "text-on-surface-variant"
          }`}
        >
          <CalendarDays size={20} />
          <span className="font-jetbrains text-[10px] mt-0.5 tracking-wider">
            Agenda
          </span>
        </Link>

        <Link
          href="/jugador/seguimiento"
          className={`flex flex-col items-center justify-center px-8 py-1.5 rounded-xl transition-all active:scale-95 ${
            pathname === "/jugador/seguimiento"
              ? "bg-primary-container text-on-primary-fixed"
              : "text-on-surface-variant"
          }`}
        >
          <TrendingUp size={20} />
          <span className="font-jetbrains text-[10px] mt-0.5 tracking-wider">
            Progreso
          </span>
        </Link>
      </nav>
    </div>
  );
}
