"use client";

import { useMemo, useState } from "react";
import { Dumbbell, FlaskConical, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { useMockAuth } from "@/context/MockAuthContext";
import { getItemsParaJugador } from "@/lib/dedup";
import { DIAS_SEMANA, FECHA_HOY, getGruposDeJugador } from "@/mocks/rugbyData";
import type { EjercicioTemplate } from "@/mocks/rugbyData";

// ─── Sub-componente: Tarjeta de Entrenamiento ─────────────────────────────────

function EntrenamientoCard({
  ejercicio,
  fecha,
}: {
  ejercicio: EjercicioTemplate;
  fecha: string;
}) {
  const { isCompletado, toggleCompletado } = useMockAuth();
  const [expanded, setExpanded] = useState(false);
  const completado = isCompletado(ejercicio.id, fecha);

  return (
    <div className="bg-surface-container p-[24px] rounded-xl border border-outline-variant overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="font-jetbrains text-[10px] tracking-[0.15em] text-primary-container uppercase">
            SESIÓN DE FUERZA
          </span>
          <h2 className="font-inter font-bold text-xl text-on-surface mt-1">
            {ejercicio.nombre}
          </h2>
        </div>
        <Dumbbell className="text-primary-container flex-shrink-0 mt-1" size={20} />
      </div>

      {/* Instrucciones expandibles */}
      <div className="mb-5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 font-jetbrains text-[10px] tracking-[0.12em] text-on-surface-variant hover:text-primary-container transition-colors mb-2"
        >
          <span>INSTRUCCIONES DEL COACH</span>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {expanded && (
          <p className="text-on-surface-variant text-sm leading-relaxed border-l-2 border-outline-variant pl-4 py-1">
            {ejercicio.descripcion}
          </p>
        )}
      </div>

      {/* Botón de estado */}
      <button
        onClick={() => toggleCompletado(ejercicio.id, fecha)}
        className={`w-full py-4 rounded-xl font-jetbrains text-[11px] tracking-[0.15em] font-bold transition-all duration-300 ${
          completado
            ? "status-toggle-active"
            : "bg-surface-container-highest text-on-surface-variant border border-outline-variant hover:border-outline"
        }`}
      >
        {completado ? "✓  REALIZADO" : "NO REALIZADO"}
      </button>
    </div>
  );
}

// ─── Sub-componente: Tarjeta de Test ─────────────────────────────────────────

function TestCard({
  ejercicio,
  fecha,
}: {
  ejercicio: EjercicioTemplate;
  fecha: string;
}) {
  const { guardarResultadoTest, getResultadoTest } = useMockAuth();
  const [inputValue, setInputValue] = useState("");
  const resultadoGuardado = getResultadoTest(ejercicio.id, fecha);

  function handleEnviar() {
    if (!inputValue.trim()) return;
    guardarResultadoTest({ ejercicioId: ejercicio.id, fecha, valor: inputValue });
    setInputValue("");
  }

  return (
    <div className="bg-surface-container p-[24px] rounded-xl border border-outline-variant">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="font-jetbrains text-[10px] tracking-[0.15em] text-secondary uppercase">
            EVALUACIÓN
          </span>
          <h2 className="font-inter font-bold text-xl text-on-surface mt-1">
            {ejercicio.nombre}
          </h2>
        </div>
        <FlaskConical className="text-secondary flex-shrink-0 mt-1" size={20} />
      </div>

      <p className="text-on-surface-variant text-sm leading-relaxed border-l-2 border-outline-variant pl-4 py-1 mb-5">
        {ejercicio.descripcion}
      </p>

      {/* Resultado guardado */}
      {resultadoGuardado && (
        <div className="mb-4 p-4 bg-primary-container/10 border border-primary-container/30 rounded-lg flex items-center justify-between">
          <div>
            <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase">
              Resultado guardado
            </p>
            <p className="font-jetbrains font-bold text-2xl text-primary-container mt-1">
              {resultadoGuardado}{" "}
              <span className="text-sm font-normal text-on-surface-variant">
                {ejercicio.unidad}
              </span>
            </p>
          </div>
          <CheckCircle2 className="text-primary-container" size={24} />
        </div>
      )}

      {/* Input */}
      <div className="mb-4">
        <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
          {ejercicio.unidad ? `Resultado en ${ejercicio.unidad}` : "Resultado"}
        </label>
        <input
          type="number"
          inputMode="decimal"
          placeholder={resultadoGuardado ?? "0"}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-center font-jetbrains text-xl focus:border-primary-container focus:outline-none transition-colors text-on-surface placeholder:text-on-surface-variant/40"
        />
      </div>

      <button
        onClick={handleEnviar}
        disabled={!inputValue.trim()}
        className="w-full py-4 rounded-xl bg-primary-container text-on-primary-fixed font-jetbrains text-[11px] tracking-[0.15em] font-black hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ENVIAR RESULTADO
      </button>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AgendaPage() {
  const {
    usuarioActivo,
    fechaSeleccionada,
    setFechaSeleccionada,
    agenda,
  } = useMockAuth();

  const items = useMemo(() => {
    if (!usuarioActivo || usuarioActivo.tipo !== "jugador") return [];
    return getItemsParaJugador(usuarioActivo.posiciones, fechaSeleccionada, agenda);
  }, [usuarioActivo, fechaSeleccionada, agenda]);

  const entrenamientos = items.filter((i) => i.ejercicio.tipo === "ejercicio");
  const tests = items.filter((i) => i.ejercicio.tipo === "test");

  // Nombre del día seleccionado
  const diaActivo = DIAS_SEMANA.find((d) => d.fecha === fechaSeleccionada);
  const labelDia = diaActivo
    ? new Date(fechaSeleccionada + "T12:00:00").toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : fechaSeleccionada;

  return (
    <div className="px-[20px] pt-6">
      {/* ── Encabezado ────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="font-jetbrains text-[10px] tracking-[0.15em] text-on-surface-variant uppercase mb-1 capitalize">
          {labelDia}
        </p>
        <h2
          className="font-inter font-black text-2xl text-primary"
          style={{ letterSpacing: "-0.01em" }}
        >
          Mi Agenda
        </h2>
      </div>

      {/* ── Selector de días ──────────────────────────────────── */}
      <section className="mb-8 -mx-[20px] px-[20px] overflow-x-auto hide-scrollbar">
        <div className="flex gap-3 pb-2">
          {DIAS_SEMANA.map((dia) => {
            const esHoy = dia.fecha === FECHA_HOY;
            const seleccionado = dia.fecha === fechaSeleccionada;
            return (
              <button
                key={dia.fecha}
                onClick={() => setFechaSeleccionada(dia.fecha)}
                className={`flex flex-col items-center justify-center min-w-[56px] py-3 rounded-xl border transition-all duration-200 ${
                  seleccionado
                    ? "border-2 border-primary-container bg-surface-container-high neon-glow"
                    : esHoy
                    ? "border border-outline bg-surface-container-low"
                    : "border border-outline-variant bg-surface-container-low opacity-60"
                }`}
              >
                <span
                  className={`font-jetbrains text-[10px] tracking-widest mb-1 ${
                    seleccionado ? "text-primary-container" : "text-on-surface-variant"
                  }`}
                >
                  {dia.label}
                </span>
                <span className="font-jetbrains font-bold text-lg text-on-surface">
                  {dia.numero}
                </span>
                {seleccionado && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-container mt-1" />
                )}
                {esHoy && !seleccionado && (
                  <div className="w-1 h-1 rounded-full bg-outline mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Sin actividad ─────────────────────────────────────── */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center mb-4 border border-outline-variant">
            <span className="text-2xl">🏉</span>
          </div>
          <p className="font-inter font-semibold text-on-surface mb-1">
            Sin actividad
          </p>
          <p className="font-jetbrains text-[11px] text-on-surface-variant">
            No hay ejercicios asignados para este día
          </p>
        </div>
      )}

      {/* ── Entrenamientos ────────────────────────────────────── */}
      {entrenamientos.map((item) => (
        <section key={item.ejercicio.id} className="mb-6">
          <EntrenamientoCard ejercicio={item.ejercicio} fecha={fechaSeleccionada} />
        </section>
      ))}

      {/* ── Tests ────────────────────────────────────────────── */}
      {tests.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-jetbrains text-[10px] tracking-[0.15em] text-on-surface-variant uppercase">
              Evaluaciones del día
            </span>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>
        </div>
      )}
      {tests.map((item) => (
        <section key={item.ejercicio.id} className="mb-6">
          <TestCard ejercicio={item.ejercicio} fecha={fechaSeleccionada} />
        </section>
      ))}

      {/* ── Dedup debug badge (solo en desarrollo) ───────────── */}
      {process.env.NODE_ENV === "development" && items.length > 0 && usuarioActivo?.tipo === "jugador" && (
        <div className="mb-8 p-3 bg-surface-container-high border border-outline-variant rounded-lg">
          <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant/50 uppercase mb-1">
            Debug · Deduplicación activa
          </p>
          <p className="font-jetbrains text-[10px] text-on-surface-variant">
            {items.length} item(s) único(s) para {usuarioActivo.nombre}
          </p>
          <p className="font-jetbrains text-[9px] text-on-surface-variant/40 mt-0.5">
            Grupos: {getGruposDeJugador(usuarioActivo.posiciones).join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}
