"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { METRICAS_HISTORICAS } from "@/mocks/rugbyData";

// ─── Utilidad: normaliza datos a coordenadas SVG ──────────────────────────────

function buildSvgPath(
  data: number[],
  refMin: number,
  refMax: number,
  vW: number,
  vH: number,
  padX: number,
  padY: number
): string {
  const range = refMax - refMin || 1;
  const chartW = vW - padX * 2;
  const chartH = vH - padY * 2;
  const step = chartW / Math.max(data.length - 1, 1);
  return data
    .map((v, i) => {
      const x = padX + i * step;
      const y = padY + chartH - ((v - refMin) / range) * chartH;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildDots(
  data: number[],
  refMin: number,
  refMax: number,
  vW: number,
  vH: number,
  padX: number,
  padY: number
): { cx: number; cy: number }[] {
  const range = refMax - refMin || 1;
  const chartW = vW - padX * 2;
  const chartH = vH - padY * 2;
  const step = chartW / Math.max(data.length - 1, 1);
  return data.map((v, i) => ({
    cx: padX + i * step,
    cy: padY + chartH - ((v - refMin) / range) * chartH,
  }));
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function SeguimientoPage() {
  const { usuarioActivo, todosLosEjercicios } = useAppContext();
  const TESTS = todosLosEjercicios.filter((e) => e.tipo === "test");
  const [testId, setTestId] = useState<string>("");

  // Cuando cargan los tests, seleccionar el primero automáticamente
  useEffect(() => {
    if (!testId && TESTS.length > 0) setTestId(TESTS[0].id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [TESTS.length]);

  const metrica = useMemo(
    () => METRICAS_HISTORICAS.find((m) => m.testId === testId),
    [testId]
  );
  const ejercicio = TESTS.find((t) => t.id === testId);

  if (!usuarioActivo || usuarioActivo.tipo !== "jugador") return null;

  const jugadorId = usuarioActivo.id;
  const datosJugador: number[] = metrica?.porJugador[jugadorId] ?? [];
  const datosEquipo: number[] = metrica?.promedioEquipo ?? [];
  const semanas: string[] = metrica?.semanas ?? [];

  // Rango global para normalizar ambas líneas igual
  const allValues = [...datosJugador, ...datosEquipo];
  const globalMin = allValues.length ? Math.min(...allValues) : 0;
  const globalMax = allValues.length ? Math.max(...allValues) : 100;
  const margin = (globalMax - globalMin) * 0.15;
  const yMin = globalMin - margin;
  const yMax = globalMax + margin;

  // SVG dimensiones
  const VW = 360;
  const VH = 160;
  const PAD_X = 16;
  const PAD_Y = 12;

  const pathJugador = buildSvgPath(datosJugador, yMin, yMax, VW, VH, PAD_X, PAD_Y);
  const pathEquipo = buildSvgPath(datosEquipo, yMin, yMax, VW, VH, PAD_X, PAD_Y);
  const dotsJugador = buildDots(datosJugador, yMin, yMax, VW, VH, PAD_X, PAD_Y);

  // Stats del jugador
  const ultimo = datosJugador.at(-1) ?? 0;
  const penultimo = datosJugador.at(-2) ?? 0;
  const ultimoEquipo = datosEquipo.at(-1) ?? 0;
  const diff = ultimo - penultimo;
  const vsEquipo = ultimo - ultimoEquipo;
  const esPositivo = ejercicio?.id === "test3" ? diff <= 0 : diff >= 0;
  const esMejorQueEquipo = ejercicio?.id === "test3" ? vsEquipo <= 0 : vsEquipo >= 0;

  // Grid lines Y (4 líneas)
  const gridLines = [0.25, 0.5, 0.75].map((pct) => ({
    y: PAD_Y + (VH - PAD_Y * 2) * (1 - pct),
    value: (yMin + (yMax - yMin) * pct).toFixed(
      ejercicio?.id === "test3" ? 1 : 0
    ),
  }));

  return (
    <div className="px-[20px] pt-6 pb-4">
      {/* ── Encabezado ────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="font-jetbrains text-[10px] tracking-[0.15em] text-on-surface-variant uppercase mb-1">
          Mi progreso
        </p>
        <h2
          className="font-inter font-black text-2xl text-primary"
          style={{ letterSpacing: "-0.01em" }}
        >
          Seguimiento
        </h2>
      </div>

      {/* ── Selector de test ──────────────────────────────────── */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1">
        {TESTS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTestId(t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-jetbrains text-[10px] tracking-widest transition-all border ${
              testId === t.id
                ? "bg-primary-container text-on-primary-fixed border-primary-container neon-glow-sm"
                : "bg-surface-container text-on-surface-variant border-outline-variant hover:border-outline"
            }`}
          >
            {t.nombre.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Tarjeta del gráfico ───────────────────────────────── */}
      <div className="bg-surface-container p-[24px] rounded-xl border border-outline-variant mb-4">
        {/* Encabezado del gráfico */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-jetbrains text-[10px] tracking-[0.15em] text-on-surface-variant uppercase">
              {ejercicio?.nombre}
            </h3>
            <p className="font-inter font-bold text-sm text-on-surface mt-0.5">
              Evolución · {semanas.length} semanas
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-container" />
              <span className="font-jetbrains text-[9px] text-on-surface-variant tracking-wider">
                YO
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full border border-dashed border-outline" />
              <span className="font-jetbrains text-[9px] text-on-surface-variant tracking-wider">
                EQUIPO
              </span>
            </div>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="relative w-full" style={{ height: VH + 24 }}>
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            className="w-full"
            style={{ height: VH }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            {gridLines.map((gl, i) => (
              <line
                key={i}
                x1={PAD_X}
                x2={VW - PAD_X}
                y1={gl.y}
                y2={gl.y}
                stroke="#334155"
                strokeOpacity={0.2}
                strokeWidth={1}
              />
            ))}

            {/* Team average (dashed) */}
            {datosEquipo.length > 0 && (
              <path
                d={pathEquipo}
                fill="none"
                stroke="#8e9379"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            )}

            {/* Player path (neon green) */}
            {datosJugador.length > 0 && (
              <path
                d={pathJugador}
                fill="none"
                stroke="#c3f400"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 4px rgba(195,244,0,0.4))" }}
              />
            )}

            {/* Dots on player path */}
            {dotsJugador.map((dot, i) => (
              <circle
                key={i}
                cx={dot.cx}
                cy={dot.cy}
                r={i === dotsJugador.length - 1 ? 5 : 3}
                fill={i === dotsJugador.length - 1 ? "#c3f400" : "#c3f400"}
                opacity={i === dotsJugador.length - 1 ? 1 : 0.5}
              />
            ))}
          </svg>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-[16px]">
            {semanas.map((s, i) => (
              <span
                key={i}
                className="font-jetbrains text-[9px] text-on-surface-variant tracking-wider"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
            <p className="font-jetbrains text-[9px] tracking-wider text-on-surface-variant uppercase">
              Actual
            </p>
            <p className="font-jetbrains font-bold text-lg text-primary-container mt-0.5">
              {ultimo}
              <span className="text-xs font-normal text-on-surface-variant ml-1">
                {ejercicio?.unidad}
              </span>
            </p>
          </div>
          <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
            <p className="font-jetbrains text-[9px] tracking-wider text-on-surface-variant uppercase">
              Variación
            </p>
            <p
              className={`font-jetbrains font-bold text-lg mt-0.5 ${
                esPositivo ? "text-primary-container" : "text-error"
              }`}
            >
              {diff > 0 ? "+" : ""}
              {diff.toFixed(ejercicio?.id === "test3" ? 2 : 0)}
            </p>
          </div>
          <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
            <p className="font-jetbrains text-[9px] tracking-wider text-on-surface-variant uppercase">
              vs Equipo
            </p>
            <p
              className={`font-jetbrains font-bold text-lg mt-0.5 ${
                esMejorQueEquipo ? "text-primary-container" : "text-secondary"
              }`}
            >
              {vsEquipo > 0 ? "+" : ""}
              {vsEquipo.toFixed(ejercicio?.id === "test3" ? 2 : 0)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Historial de valores ──────────────────────────────── */}
      <div className="bg-surface-container p-[24px] rounded-xl border border-outline-variant">
        <h3 className="font-jetbrains text-[10px] tracking-[0.15em] text-on-surface-variant uppercase mb-4">
          Historial · {ejercicio?.nombre}
        </h3>
        <div className="space-y-2">
          {semanas.map((semana, i) => {
            const valJugador = datosJugador[i] ?? 0;
            const valEquipo = datosEquipo[i] ?? 0;
            const esUltimo = i === semanas.length - 1;
            return (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  esUltimo
                    ? "border-primary-container/40 bg-primary-container/5"
                    : "border-outline-variant bg-surface-container-low"
                }`}
              >
                <span
                  className={`font-jetbrains text-[10px] tracking-wider ${
                    esUltimo ? "text-primary-container font-bold" : "text-on-surface-variant"
                  }`}
                >
                  {semana}
                  {esUltimo && " ★"}
                </span>
                <div className="flex items-center gap-4">
                  <span className="font-jetbrains text-[11px] text-on-surface-variant">
                    Eq: {valEquipo}
                  </span>
                  <span
                    className={`font-jetbrains font-bold text-[13px] ${
                      esUltimo ? "text-primary-container" : "text-on-surface"
                    }`}
                  >
                    {valJugador}{" "}
                    <span className="text-[9px] font-normal text-on-surface-variant">
                      {ejercicio?.unidad}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
