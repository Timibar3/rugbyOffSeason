"use client";

import { useRouter } from "next/navigation";
import { useMockAuth } from "@/context/MockAuthContext";
import { JUGADORES, STAFF } from "@/mocks/rugbyData";

export default function HomePage() {
  const { login } = useMockAuth();
  const router = useRouter();

  function handleLoginJugador(id: string) {
    login(id);
    router.push("/jugador/agenda");
  }

  function handleLoginStaff(id: string, rol: string) {
    login(id);
    if (rol === "head_coach" || rol === "entrenador") {
      router.push("/entrenador/agenda");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-surface px-margin-mobile py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-2 h-8 bg-primary-container" />
          <span className="font-jetbrains text-[11px] tracking-[0.2em] text-on-surface-variant uppercase">
            Sistema de Pretemporada
          </span>
        </div>
        <h1
          className="font-inter font-black text-4xl md:text-5xl text-primary tracking-tighter leading-none mb-3"
          style={{ letterSpacing: "-0.02em" }}
        >
          RUGBY
          <br />
          <span className="text-primary-container">PERFORMANCE</span>
        </h1>
        <p className="text-on-surface-variant text-sm max-w-xs mx-auto">
          Seleccioná tu perfil para entrar al sistema de entrenamiento
        </p>
      </div>

      <div className="w-full max-w-sm space-y-8">
        {/* ── Jugadores ─────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-jetbrains text-[10px] tracking-[0.15em] text-on-surface-variant uppercase">
              Plantel
            </span>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>
          <div className="space-y-2">
            {JUGADORES.map((jugador) => (
              <button
                key={jugador.id}
                onClick={() => handleLoginJugador(jugador.id)}
                className="w-full flex items-center gap-4 p-4 bg-surface-container border border-outline-variant rounded-lg hover:border-primary-container hover:bg-surface-container-high transition-all duration-200 group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded bg-surface-container-highest flex items-center justify-center flex-shrink-0 group-hover:bg-primary-container/10 transition-colors">
                  <span className="font-jetbrains text-xs font-bold text-on-surface-variant group-hover:text-primary-container transition-colors">
                    {jugador.iniciales}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <p className="font-inter font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
                    {jugador.nombre}
                  </p>
                  <p className="font-jetbrains text-[10px] text-on-surface-variant tracking-wider mt-0.5">
                    #{jugador.numero} ·{" "}
                    {jugador.posiciones.join(" / ")}
                  </p>
                </div>

                {/* Indicador */}
                <div className="w-5 h-5 rounded border border-outline-variant flex items-center justify-center group-hover:border-primary-container transition-colors">
                  <svg
                    className="w-3 h-3 text-on-surface-variant group-hover:text-primary-container transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Staff técnico ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-jetbrains text-[10px] tracking-[0.15em] text-on-surface-variant uppercase">
              Staff Técnico
            </span>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>
          <div className="space-y-2">
            {STAFF.map((staff) => {
              const isHeadCoach = staff.rol === "head_coach";
              return (
                <button
                  key={staff.id}
                  onClick={() => handleLoginStaff(staff.id, staff.rol)}
                  className="w-full flex items-center gap-4 p-4 bg-surface-container border border-outline-variant rounded-lg hover:border-primary-container hover:bg-surface-container-high transition-all duration-200 group"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 bg-surface-container-highest group-hover:bg-primary-container/10 transition-colors">
                    <span className="font-jetbrains text-xs font-bold text-on-surface-variant group-hover:text-primary-container transition-colors">
                      {staff.iniciales}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <p className="font-inter font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
                      {staff.nombre}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {isHeadCoach && (
                        <span className="inline-flex items-center font-jetbrains text-[9px] tracking-wider bg-primary-container/10 text-primary-container border border-primary-container/30 px-1.5 py-0.5 rounded-sm">
                          HEAD COACH
                        </span>
                      )}
                      {!isHeadCoach && (
                        <span className="inline-flex items-center font-jetbrains text-[9px] tracking-wider bg-secondary-container/20 text-on-secondary-container border border-outline-variant px-1.5 py-0.5 rounded-sm">
                          ENTRENADOR
                        </span>
                      )}
                      <span className="font-jetbrains text-[10px] text-on-surface-variant">
                        Vista desktop
                      </span>
                    </div>
                  </div>

                  {/* Indicador */}
                  <div className="w-5 h-5 rounded border border-outline-variant flex items-center justify-center group-hover:border-primary-container transition-colors">
                    <svg
                      className="w-3 h-3 text-on-surface-variant group-hover:text-primary-container transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="font-jetbrains text-[10px] text-on-surface-variant/40 tracking-widest uppercase">
          Modo local · Mock data · Sin Supabase
        </p>
      </div>
    </main>
  );
}
