"use client";

import { useMemo } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { JUGADORES, DIAS_SEMANA, FECHA_HOY } from "@/mocks/rugbyData";
import type { EstadoCumplimiento } from "@/mocks/rugbyData";

// ─── Célula de la grilla ──────────────────────────────────────────────────────

function CeldaCumplimiento({
  estado,
  esFuturo,
}: {
  estado: EstadoCumplimiento;
  esFuturo: boolean;
}) {
  if (esFuturo || estado === null) {
    return (
      <div className="w-8 h-8 rounded-full border border-dashed border-outline-variant/40 flex items-center justify-center mx-auto">
        <span className="text-outline-variant text-[10px]">—</span>
      </div>
    );
  }
  if (estado === true) {
    return (
      <div
        className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center mx-auto"
        style={{ boxShadow: "0 0 8px rgba(195,244,0,0.3)" }}
        title="Completado"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#161e00"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  // estado === false
  return (
    <div
      className="w-8 h-8 rounded-full border-2 border-outline-variant/60 flex items-center justify-center mx-auto"
      title="No completado"
    >
      <div className="w-2 h-2 rounded-full bg-outline-variant/50" />
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CumplimientoPage() {
  const { cumplimiento } = useMockAuth();

  // Días de la semana visibles (lunes a viernes)
  const diasVisibles = DIAS_SEMANA.slice(0, 5);

  // Calcular porcentaje de cumplimiento por jugador
  const stats = useMemo(() => {
    return JUGADORES.map((j) => {
      const datos = cumplimiento[j.id] ?? {};
      const diasConDatos = diasVisibles.filter(
        (d) => datos[d.fecha] !== null && datos[d.fecha] !== undefined
      );
      const completados = diasConDatos.filter((d) => datos[d.fecha] === true);
      const pct =
        diasConDatos.length > 0
          ? Math.round((completados.length / diasConDatos.length) * 100)
          : 0;
      return { jugadorId: j.id, pct, completados: completados.length, total: diasConDatos.length };
    });
  }, [cumplimiento, diasVisibles]);

  // Totales del equipo
  const equipoPct = useMemo(() => {
    const totalCeldas = stats.reduce((a, s) => a + s.total, 0);
    const totalComp = stats.reduce((a, s) => a + s.completados, 0);
    return totalCeldas > 0 ? Math.round((totalComp / totalCeldas) * 100) : 0;
  }, [stats]);

  return (
    <div className="p-6 md:p-[40px]">
      {/* ── Encabezado ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="font-jetbrains text-[10px] tracking-[0.15em] text-on-surface-variant uppercase mb-1">
            Staff · Monitoreo
          </p>
          <h1
            className="font-inter font-black text-2xl md:text-3xl text-primary"
            style={{ letterSpacing: "-0.01em" }}
          >
            Cumplimiento Semanal
          </h1>
        </div>

        {/* Badge del equipo */}
        <div className="flex items-center gap-3 p-3 bg-surface-container border border-outline-variant rounded-xl self-start md:self-auto">
          <div>
            <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase">
              Equipo
            </p>
            <p
              className={`font-jetbrains font-bold text-2xl ${
                equipoPct >= 80
                  ? "text-primary-container"
                  : equipoPct >= 50
                  ? "text-secondary"
                  : "text-error"
              }`}
            >
              {equipoPct}%
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(#c3f400 ${equipoPct * 3.6}deg, #2a2a2a 0deg)`,
            }}
          >
            <div className="w-8 h-8 rounded-full bg-surface-container" />
          </div>
        </div>
      </div>

      {/* ── Leyenda ───────────────────────────────────────────── */}
      <div className="flex gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-primary-container" style={{ boxShadow: "0 0 6px rgba(195,244,0,0.3)" }} />
          <span className="font-jetbrains text-[10px] tracking-wider text-on-surface-variant">
            Completado
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-outline-variant/60" />
          <span className="font-jetbrains text-[10px] tracking-wider text-on-surface-variant">
            No completado
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border border-dashed border-outline-variant/40" />
          <span className="font-jetbrains text-[10px] tracking-wider text-on-surface-variant">
            Sin actividad / Futuro
          </span>
        </div>
      </div>

      {/* ── Grilla ────────────────────────────────────────────── */}
      <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        {/* Header de la tabla */}
        <div className="grid bg-surface-container-low border-b border-outline-variant"
          style={{ gridTemplateColumns: "1fr repeat(5, 56px) 64px" }}
        >
          <div className="p-4">
            <span className="font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase">
              Jugador
            </span>
          </div>
          {diasVisibles.map((dia) => (
            <div
              key={dia.fecha}
              className={`p-2 text-center border-l border-outline-variant/30 ${
                dia.fecha === FECHA_HOY ? "bg-primary-container/5" : ""
              }`}
            >
              <p
                className={`font-jetbrains text-[10px] tracking-widest ${
                  dia.fecha === FECHA_HOY
                    ? "text-primary-container"
                    : "text-on-surface-variant"
                }`}
              >
                {dia.label}
              </p>
              <p
                className={`font-jetbrains font-bold text-sm ${
                  dia.fecha === FECHA_HOY ? "text-primary-container" : "text-on-surface"
                }`}
              >
                {dia.numero}
              </p>
            </div>
          ))}
          <div className="p-2 text-center border-l border-outline-variant/30">
            <span className="font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase">
              %
            </span>
          </div>
        </div>

        {/* Filas de jugadores */}
        {JUGADORES.map((jugador, idx) => {
          const datosCumpl = cumplimiento[jugador.id] ?? {};
          const jugadorStats = stats[idx];

          return (
            <div
              key={jugador.id}
              className={`grid items-center border-b border-outline-variant/30 hover:bg-surface-container-high/50 transition-colors ${
                idx % 2 === 0 ? "" : "bg-surface-container-low/30"
              }`}
              style={{ gridTemplateColumns: "1fr repeat(5, 56px) 64px" }}
            >
              {/* Jugador info */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center flex-shrink-0">
                  <span className="font-jetbrains text-[10px] font-bold text-on-surface-variant">
                    {jugador.iniciales}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-inter font-semibold text-xs text-on-surface truncate">
                    {jugador.nombre}
                  </p>
                  <p className="font-jetbrains text-[9px] text-on-surface-variant truncate">
                    {jugador.posiciones.join(" / ")}
                  </p>
                </div>
              </div>

              {/* Celdas de días */}
              {diasVisibles.map((dia) => {
                const esFuturo = dia.fecha > FECHA_HOY;
                const estado = datosCumpl[dia.fecha] ?? null;
                return (
                  <div
                    key={dia.fecha}
                    className={`py-3 border-l border-outline-variant/30 ${
                      dia.fecha === FECHA_HOY ? "bg-primary-container/5" : ""
                    }`}
                  >
                    <CeldaCumplimiento estado={estado} esFuturo={esFuturo} />
                  </div>
                );
              })}

              {/* Porcentaje */}
              <div className="py-3 text-center border-l border-outline-variant/30">
                <span
                  className={`font-jetbrains font-bold text-sm ${
                    jugadorStats.pct >= 80
                      ? "text-primary-container"
                      : jugadorStats.pct >= 50
                      ? "text-secondary"
                      : "text-error"
                  }`}
                >
                  {jugadorStats.total > 0 ? `${jugadorStats.pct}%` : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Insight staff ─────────────────────────────────────── */}
      <div className="mt-6 p-4 bg-primary-container/5 border border-primary-container/20 rounded-xl flex gap-3">
        <span className="text-xl flex-shrink-0">💡</span>
        <div>
          <p className="font-inter font-bold text-xs text-primary uppercase mb-1">
            Staff Insight
          </p>
          <p className="font-inter text-xs text-on-surface-variant leading-relaxed">
            Los datos mostrados corresponden al{" "}
            <span className="text-on-surface font-semibold">
              microciclo actual
            </span>
            . Los días futuros se actualizarán en tiempo real cuando los
            jugadores marquen sus actividades como realizadas.
          </p>
        </div>
      </div>
    </div>
  );
}
