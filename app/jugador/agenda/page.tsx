"use client";

import { useMemo, useState } from "react";
import { Dumbbell, FlaskConical, ChevronDown, ChevronRight, CheckCircle2, ChevronLeft } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { getItemsParaJugador } from "@/lib/dedup";
import { getGruposDeJugador, IMAGEN_FALLBACK } from "@/mocks/rugbyData";
import type { EjercicioTemplate } from "@/mocks/rugbyData";
import { getSemanaActual, getFechaHoy } from "@/lib/semana";

// ─── Sub-componente: Miniatura de imágenes con carrusel compacto ─────────────

function MiniCarrusel({ imagenes }: { imagenes: string[] }) {
  const imgs = imagenes.length > 0 ? imagenes : [IMAGEN_FALLBACK];
  const [idx, setIdx] = useState(0);

  return (
    <div className="relative flex-shrink-0 w-28 h-24 rounded-lg overflow-hidden bg-surface-container-high">
      <img
        src={imgs[idx]}
        alt=""
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = IMAGEN_FALLBACK;
        }}
      />
      {imgs.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + imgs.length) % imgs.length); }}
            className="absolute left-0.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-all"
            aria-label="Imagen anterior"
          >
            <ChevronLeft size={10} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % imgs.length); }}
            className="absolute right-0.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-all"
            aria-label="Imagen siguiente"
          >
            <ChevronRight size={10} />
          </button>
          <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/60 text-white font-jetbrains text-[8px] rounded leading-none">
            {idx + 1}/{imgs.length}
          </span>
        </>
      )}
    </div>
  );
}

// ─── Sub-componente: Tarjeta de Entrenamiento ─────────────────────────────────

function EntrenamientoCard({
  ejercicio,
  fecha,
  comentarioEntrenador,
}: {
  ejercicio: EjercicioTemplate;
  fecha: string;
  comentarioEntrenador?: string;
}) {
  const { isCompletado, toggleCompletado } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const completado = isCompletado(ejercicio.id, fecha);

  return (
    <div className="bg-surface-container p-[24px] rounded-xl border border-outline-variant overflow-hidden">
      {/* Header + miniatura en fila */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Dumbbell className="text-primary-container flex-shrink-0" size={12} />
            <span className="font-jetbrains text-[10px] tracking-[0.15em] text-primary-container uppercase">
              SESIÓN DE ENTRENAMIENTO
            </span>
          </div>
          <h2 className="font-inter font-bold text-xl text-on-surface">
            {ejercicio.nombre}
          </h2>
        </div>
        <MiniCarrusel imagenes={ejercicio.imagenes} />
      </div>

      {/* Comentario del entrenador — destacado */}
      {comentarioEntrenador && (
        <div className="mb-4 p-4 bg-primary-container/8 border-l-2 border-primary-container rounded-r-lg">
          <p className="font-jetbrains text-[9px] tracking-widest text-primary-container uppercase mb-1.5">
            Indicaciones del entrenador
          </p>
          <p className="font-inter text-sm text-on-surface leading-relaxed font-medium">
            {comentarioEntrenador}
          </p>
        </div>
      )}

      {/* Instrucciones del catálogo — expandibles */}
      <div className="mb-5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 font-jetbrains text-[10px] tracking-[0.12em] text-on-surface-variant hover:text-primary-container transition-colors mb-2"
        >
          <span>DESCRIPCIÓN DEL EJERCICIO</span>
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
  comentarioEntrenador,
}: {
  ejercicio: EjercicioTemplate;
  fecha: string;
  comentarioEntrenador?: string;
}) {
  const { guardarResultadoTest, getResultadoTest } = useAppContext();
  const [inputValue, setInputValue] = useState("");
  const resultadoGuardado = getResultadoTest(ejercicio.id, fecha);

  function handleEnviar() {
    if (!inputValue.trim()) return;
    guardarResultadoTest({ ejercicioId: ejercicio.id, fecha, valor: inputValue });
    setInputValue("");
  }

  return (
    <div className="bg-surface-container p-[24px] rounded-xl border border-outline-variant">
      {/* Header + miniatura en fila */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <FlaskConical className="text-secondary flex-shrink-0" size={12} />
            <span className="font-jetbrains text-[10px] tracking-[0.15em] text-secondary uppercase">
              EVALUACIÓN
            </span>
          </div>
          <h2 className="font-inter font-bold text-xl text-on-surface">
            {ejercicio.nombre}
          </h2>
        </div>
        <MiniCarrusel imagenes={ejercicio.imagenes} />
      </div>

      {/* Comentario del entrenador — destacado */}
      {comentarioEntrenador && (
        <div className="mb-4 p-4 bg-secondary/8 border-l-2 border-secondary rounded-r-lg">
          <p className="font-jetbrains text-[9px] tracking-widest text-secondary uppercase mb-1.5">
            Indicaciones del entrenador
          </p>
          <p className="font-inter text-sm text-on-surface leading-relaxed font-medium">
            {comentarioEntrenador}
          </p>
        </div>
      )}

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

const DIAS_SEMANA = getSemanaActual();
const FECHA_HOY = getFechaHoy();

export default function AgendaPage() {
  const {
    usuarioActivo,
    fechaSeleccionada,
    setFechaSeleccionada,
    agenda,
    todosLosEjercicios,
  } = useAppContext();

  const items = useMemo(() => {
    if (!usuarioActivo || usuarioActivo.tipo !== "jugador") return [];
    // Pasar todosLosEjercicios para incluir los ejercicios personalizados
    // creados por el entrenador, que no están en EJERCICIOS_TEMPLATE.
    return getItemsParaJugador(
      usuarioActivo.posiciones,
      fechaSeleccionada,
      agenda,
      todosLosEjercicios
    );
  }, [usuarioActivo, fechaSeleccionada, agenda, todosLosEjercicios]);

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
          <EntrenamientoCard
            ejercicio={item.ejercicio}
            fecha={fechaSeleccionada}
            comentarioEntrenador={item.comentarioEntrenador}
          />
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
          <TestCard
            ejercicio={item.ejercicio}
            fecha={fechaSeleccionada}
            comentarioEntrenador={item.comentarioEntrenador}
          />
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
