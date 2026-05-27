"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, FlaskConical } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import {
  METRICAS_HISTORICAS,
  getGruposDeJugador,
  Grupo,
  MetricaHistorica,
} from "@/mocks/rugbyData";
import type { JugadorEquipo } from "@/context/AppContext";
import { createClient } from "@/lib/supabase/client";

// ─── Árbol de jerarquías ──────────────────────────────────────────────────────

interface NodoFiltro {
  label: string;
  grupo: Grupo;
  hijos?: NodoFiltro[];
}

const ARBOL_FILTROS: NodoFiltro[] = [
  {
    label: "Plantel Completo",
    grupo: "Plantel Completo",
    hijos: [
      {
        label: "Forwards",
        grupo: "Forwards",
        hijos: [
          { label: "1ra Línea", grupo: "1ra Línea" },
          { label: "2da Línea", grupo: "2da Línea" },
          { label: "3ra Línea", grupo: "3ra Línea" },
        ],
      },
      {
        label: "Backs",
        grupo: "Backs",
        hijos: [
          { label: "Medios", grupo: "Medio Scrum" },
          { label: "Aperturas", grupo: "Apertura" },
          { label: "Centros", grupo: "1er Centro" },
          { label: "Wings", grupo: "Wing" },
          { label: "Fullbacks", grupo: "Fullback" },
        ],
      },
    ],
  },
];

function NodoFiltroItem({
  nodo,
  nivel,
  seleccionado,
  onSelect,
}: {
  nodo: NodoFiltro;
  nivel: number;
  seleccionado: Grupo;
  onSelect: (g: Grupo) => void;
}) {
  const [expandido, setExpandido] = useState(nivel === 0);
  const activo = seleccionado === nodo.grupo;

  return (
    <li>
      <button
        onClick={() => {
          onSelect(nodo.grupo);
          if (nodo.hijos) setExpandido((v) => !v);
        }}
        className={`w-full text-left flex items-center justify-between py-2 px-3 rounded-lg transition-all font-inter text-sm ${
          activo
            ? "text-primary-container font-semibold bg-primary-container/10"
            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
        }`}
        style={{ paddingLeft: `${(nivel + 1) * 12}px` }}
      >
        <span>{nodo.label}</span>
        {nodo.hijos && (
          <span className="text-xs text-on-surface-variant">
            {expandido ? "▾" : "▸"}
          </span>
        )}
      </button>
      {nodo.hijos && expandido && (
        <ul>
          {nodo.hijos.map((hijo) => (
            <NodoFiltroItem
              key={hijo.grupo}
              nodo={hijo}
              nivel={nivel + 1}
              seleccionado={seleccionado}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ─── Generador de mock data para tests sin historial ──────────────────────────
// Determinístico: mismos valores para el mismo testId entre renders.

function generarMetricaMock(testId: string, jugadores: JugadorEquipo[]): MetricaHistorica {
  const seed = testId
    .split("")
    .reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  const baseGlobal = 40 + (seed % 120);
  const semanas = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Actual"];

  const porJugador: Record<string, number[]> = {};
  jugadores.forEach((j) => {
    const pSeed = j.id
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const base = baseGlobal + ((pSeed + seed) % 30) - 15;
    const inc = 2 + ((pSeed * (seed % 7)) % 5);
    porJugador[j.id] = semanas.map((_, i) =>
      parseFloat((base + i * inc).toFixed(1))
    );
  });

  const promedioEquipo = jugadores.length > 0
    ? semanas.map((_, i) =>
        parseFloat(
          (
            Object.values(porJugador).reduce((s, v) => s + v[i], 0) /
            jugadores.length
          ).toFixed(1)
        )
      )
    : semanas.map(() => 0);

  return { testId, semanas, promedioEquipo, porJugador };
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function InformesPage() {
  const { todosLosEjercicios, jugadoresEquipo, usuarioActivo } = useAppContext();

  // Tests dinámicos: base + personalizados creados en el catálogo
  const tests = useMemo(
    () => todosLosEjercicios.filter((e) => e.tipo === "test"),
    [todosLosEjercicios]
  );

  const [grupoFiltro, setGrupoFiltro] = useState<Grupo>("Plantel Completo");
  // Inicializar con el primer test disponible
  const [testId, setTestId] = useState(() => tests[0]?.id ?? "");
  const [metricasReales, setMetricasReales] = useState<MetricaHistorica[]>([]);

  // Cargar resultados reales de la DB
  useEffect(() => {
    if (!usuarioActivo) return;
    const supabase = createClient();

    async function cargarResultados() {
      const { data: allAgenda } = await supabase
        .from("agenda")
        .select("id, catalogo_id, fecha")
        .eq("equipo_id", usuarioActivo!.equipoId);

      if (!allAgenda?.length) return;

      const agendaIds = allAgenda.map((a) => a.id);

      const { data: resultados } = await supabase
        .from("resultados_tests")
        .select("agenda_id, jugador_id, resultado_numerico")
        .in("agenda_id", agendaIds)
        .not("resultado_numerico", "is", null);

      if (!resultados?.length) return;

      const byTest: Record<string, { fecha: string; jugador_id: string; valor: number }[]> = {};

      for (const r of resultados) {
        const ag = allAgenda.find((a) => a.id === r.agenda_id);
        if (!ag) continue;
        if (!byTest[ag.catalogo_id]) byTest[ag.catalogo_id] = [];
        byTest[ag.catalogo_id].push({
          fecha: ag.fecha,
          jugador_id: r.jugador_id,
          valor: Number(r.resultado_numerico),
        });
      }

      const metricas: MetricaHistorica[] = Object.entries(byTest).map(([catalogoId, entries]) => {
        const fechasUnicas = [...new Set(entries.map((e) => e.fecha))].sort();
        const semanas = fechasUnicas.map((f) => {
          const [, month, day] = f.split("-");
          return `${day}/${month}`;
        });

        const porJugador: Record<string, number[]> = {};
        for (const fecha of fechasUnicas) {
          for (const entry of entries.filter((e) => e.fecha === fecha)) {
            if (!porJugador[entry.jugador_id]) porJugador[entry.jugador_id] = [];
            porJugador[entry.jugador_id].push(entry.valor);
          }
        }

        const promedioEquipo = fechasUnicas.map((fecha) => {
          const vals = entries.filter((e) => e.fecha === fecha).map((e) => e.valor);
          return vals.length > 0
            ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
            : 0;
        });

        return { testId: catalogoId, semanas, promedioEquipo, porJugador };
      });

      setMetricasReales(metricas);
    }

    void cargarResultados();
  }, [usuarioActivo]);

  // Si el testId ya no existe (edge case), caer al primero disponible
  const testIdValido = tests.some((t) => t.id === testId)
    ? testId
    : (tests[0]?.id ?? "");

  const ejercicio = tests.find((t) => t.id === testIdValido);

  // Real data first, then mock historical, then generated mock
  const metrica = useMemo((): MetricaHistorica | null => {
    if (!testIdValido) return null;
    return (
      metricasReales.find((m) => m.testId === testIdValido) ??
      METRICAS_HISTORICAS.find((m) => m.testId === testIdValido) ??
      generarMetricaMock(testIdValido, jugadoresEquipo)
    );
  }, [testIdValido, jugadoresEquipo, metricasReales]);

  // Para tests de tiempo, menor es mejor (solo test3 en los datos base)
  const menorEsMejor = testIdValido === "test3";

  // ¿Es un test sin datos reales ni histórico?
  const esTestPersonalizado =
    !metricasReales.some((m) => m.testId === testIdValido) &&
    !METRICAS_HISTORICAS.some((m) => m.testId === testIdValido);

  const jugadoresFiltrados = useMemo(() => {
    if (grupoFiltro === "Plantel Completo") return jugadoresEquipo;
    return jugadoresEquipo.filter((j) =>
      getGruposDeJugador(j.posiciones).includes(grupoFiltro)
    );
  }, [grupoFiltro, jugadoresEquipo]);

  const ranking = useMemo(() => {
    if (!metrica) return [];
    return jugadoresFiltrados
      .map((j) => {
        const valores = metrica.porJugador[j.id] ?? [];
        const ultimo = valores.at(-1) ?? 0;
        const anterior = valores.at(-2) ?? ultimo;
        const tendencia = menorEsMejor ? anterior - ultimo : ultimo - anterior;
        return { jugador: j, ultimo, tendencia };
      })
      .sort((a, b) =>
        menorEsMejor ? a.ultimo - b.ultimo : b.ultimo - a.ultimo
      );
  }, [jugadoresFiltrados, metrica, menorEsMejor]);

  const promedioEquipo = metrica?.promedioEquipo.at(-1) ?? 0;
  const maxValor = ranking[0]?.ultimo ?? 0;
  const minValor = ranking.at(-1)?.ultimo ?? 0;

  function barWidth(valor: number): string {
    if (maxValor === minValor) return "100%";
    const pct = ((valor - minValor) / (maxValor - minValor)) * 100;
    return `${Math.max(pct, 8).toFixed(0)}%`;
  }

  // ── Sin tests en el catálogo ──────────────────────────────────────────────
  if (tests.length === 0) {
    return (
      <div className="p-6 md:p-[40px] flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FlaskConical className="text-on-surface-variant mb-4" size={40} />
        <p className="font-inter font-semibold text-on-surface mb-2">
          Sin tests en el catálogo
        </p>
        <p className="font-jetbrains text-[11px] text-on-surface-variant max-w-xs">
          Creá al menos un ítem de tipo TEST en el Planificador para ver informes aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-[40px]">
      {/* ── Encabezado ────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="font-jetbrains text-[10px] tracking-[0.15em] text-on-surface-variant uppercase mb-1">
          Staff · Analítica
        </p>
        <h1
          className="font-inter font-black text-2xl md:text-3xl text-primary"
          style={{ letterSpacing: "-0.01em" }}
        >
          Informes Globales
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Análisis avanzado de rendimiento — Pretemporada 2026
        </p>
      </div>

      {/* ── Banner datos simulados ─────────────────────────────── */}
      {esTestPersonalizado && ejercicio && (
        <div className="mb-6 flex items-center gap-3 p-3 bg-secondary-container/20 border border-secondary/30 rounded-xl">
          <FlaskConical size={16} className="text-secondary flex-shrink-0" />
          <p className="font-inter text-xs text-on-surface-variant leading-relaxed">
            <span className="font-semibold text-secondary">{ejercicio.nombre}</span>{" "}
            es un test nuevo — los resultados mostrados son{" "}
            <span className="font-semibold text-on-surface">datos simulados</span>.
            Se actualizarán cuando los jugadores carguen sus marcas reales.
          </p>
        </div>
      )}

      {/* ── Métricas hero ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-surface-container-high p-5 border-l-4 border-primary-container rounded-r-xl">
          <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase mb-1">
            Promedio Equipo
          </p>
          <p className="font-jetbrains font-bold text-xl text-primary">
            {promedioEquipo}
            <span className="text-xs font-normal text-on-surface-variant ml-1">
              {ejercicio?.unidad ?? "—"}
            </span>
          </p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp size={11} className="text-primary-container" />
            <span className="font-jetbrains text-[9px] text-primary-container">
              {esTestPersonalizado ? "Datos simulados" : "+2.1% vs semana anterior"}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-high p-5 border-l-4 border-outline-variant rounded-r-xl">
          <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase mb-1">
            Plantel filtrado
          </p>
          <p className="font-jetbrains font-bold text-xl text-primary">
            {jugadoresFiltrados.length}
            <span className="text-xs font-normal text-on-surface-variant ml-1">
              jugadores
            </span>
          </p>
        </div>

        <div className="bg-surface-container-high p-5 border-l-4 border-primary-container rounded-r-xl">
          <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase mb-1">
            Top del ranking
          </p>
          <p className="font-jetbrains font-bold text-xl text-primary-container">
            {maxValor}
            <span className="text-xs font-normal text-on-surface-variant ml-1">
              {ejercicio?.unidad ?? "—"}
            </span>
          </p>
        </div>

        <div className="bg-surface-container-high p-5 border-l-4 border-error rounded-r-xl">
          <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase mb-1">
            Requiere atención
          </p>
          <p className="font-jetbrains font-bold text-xl text-error">
            {ranking.filter((r) => r.tendencia < 0).length}
            <span className="text-xs font-normal text-on-surface-variant ml-1">
              atletas
            </span>
          </p>
          <div className="flex items-center gap-1 mt-1">
            <AlertTriangle size={11} className="text-error" />
            <span className="font-jetbrains text-[9px] text-error">
              Tendencia negativa
            </span>
          </div>
        </div>
      </div>

      {/* ── Layout principal: filtros + tabla ─────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-surface-container border border-outline-variant rounded-xl p-5 sticky top-24">

            {/* Filtro de plantel */}
            <h3 className="font-jetbrains text-[10px] tracking-[0.15em] text-on-surface-variant uppercase mb-4">
              Filtros de Plantel
            </h3>
            <ul className="space-y-0.5">
              {ARBOL_FILTROS.map((nodo) => (
                <NodoFiltroItem
                  key={nodo.grupo}
                  nodo={nodo}
                  nivel={0}
                  seleccionado={grupoFiltro}
                  onSelect={setGrupoFiltro}
                />
              ))}
            </ul>

            {/* Selector de métrica — dinámico */}
            <div className="mt-6 pt-5 border-t border-outline-variant">
              <h4 className="font-jetbrains text-[10px] tracking-[0.12em] text-on-surface-variant uppercase mb-3">
                Métrica
              </h4>

              <div className="space-y-1.5">
                {tests.map((t) => {
                  const activo = t.id === testIdValido;
                  const esPersonalizado =
                    !metricasReales.some((m) => m.testId === t.id) &&
                    !METRICAS_HISTORICAS.some((m) => m.testId === t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTestId(t.id)}
                      className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition-all group ${
                        activo
                          ? "bg-primary-container/10 border border-primary-container/30"
                          : "border border-transparent hover:bg-surface-container-high hover:border-outline-variant/50"
                      }`}
                    >
                      {/* Radio visual */}
                      <div
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          activo
                            ? "border-primary-container bg-primary-container"
                            : "border-outline-variant group-hover:border-outline"
                        }`}
                      >
                        {activo && (
                          <div className="w-1.5 h-1.5 rounded-full bg-on-primary-fixed" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-inter text-xs leading-tight ${
                            activo
                              ? "text-primary font-semibold"
                              : "text-on-surface-variant group-hover:text-on-surface"
                          }`}
                        >
                          {t.nombre}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {t.unidad && (
                            <span className="font-jetbrains text-[8px] tracking-wider text-on-surface-variant/60">
                              {t.unidad}
                            </span>
                          )}
                          {esPersonalizado && (
                            <span className="font-jetbrains text-[8px] tracking-wider text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">
                              NUEVO
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hint: cómo agregar más tests */}
              <p className="mt-4 font-jetbrains text-[8px] tracking-wider text-on-surface-variant/40 leading-relaxed">
                Creá tests en el Planificador para verlos aquí automáticamente.
              </p>
            </div>
          </div>
        </aside>

        {/* ── Tabla de ranking ─────────────────────────────────── */}
        <div className="flex-1">
          <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">

            {/* Header tabla */}
            <div className="p-5 border-b border-outline-variant bg-white/5 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-jetbrains text-[11px] tracking-widest text-primary uppercase">
                    Ranking · {ejercicio?.nombre}
                  </h3>
                  {esTestPersonalizado && (
                    <span className="font-jetbrains text-[8px] tracking-wider text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded">
                      SIMULADO
                    </span>
                  )}
                </div>
                <p className="font-inter text-xs text-on-surface-variant mt-0.5">
                  {grupoFiltro} · {jugadoresFiltrados.length} jugadores
                  {ejercicio?.unidad && (
                    <span className="ml-2 text-on-surface-variant/60">
                      · medido en {ejercicio.unidad}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {ranking.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-jetbrains text-[11px] text-on-surface-variant">
                  No hay jugadores para este filtro
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/50 bg-surface-container-low">
                      <th className="p-4 font-jetbrains text-[10px] text-on-surface-variant tracking-widest uppercase w-8">
                        #
                      </th>
                      <th className="p-4 font-jetbrains text-[10px] text-on-surface-variant tracking-widest uppercase">
                        Jugador
                      </th>
                      <th className="p-4 font-jetbrains text-[10px] text-on-surface-variant tracking-widest uppercase">
                        Posición
                      </th>
                      <th className="p-4 font-jetbrains text-[10px] text-on-surface-variant tracking-widest uppercase">
                        {ejercicio?.unidad
                          ? `Resultado (${ejercicio.unidad})`
                          : "Resultado"}
                      </th>
                      <th className="p-4 font-jetbrains text-[10px] text-on-surface-variant tracking-widest uppercase w-32">
                        Rel.
                      </th>
                      <th className="p-4 font-jetbrains text-[10px] text-on-surface-variant tracking-widest uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {ranking.map(({ jugador, ultimo, tendencia }, idx) => {
                      const esTop = idx === 0;
                      const positivo = tendencia > 0;
                      const neutro = tendencia === 0;

                      return (
                        <tr
                          key={jugador.id}
                          className="hover:bg-primary-container/5 transition-colors group"
                        >
                          {/* Posición */}
                          <td className="p-4">
                            <span
                              className={`font-jetbrains font-bold text-sm ${
                                esTop
                                  ? "text-primary-container"
                                  : "text-on-surface-variant"
                              }`}
                            >
                              {esTop ? "★" : idx + 1}
                            </span>
                          </td>

                          {/* Jugador */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center overflow-hidden flex-shrink-0">
                                <span className="font-jetbrains text-[10px] font-bold text-on-surface-variant">
                                  {jugador.iniciales}
                                </span>
                              </div>
                              <span className="font-inter font-semibold text-sm text-on-surface">
                                {jugador.nombre}
                              </span>
                            </div>
                          </td>

                          {/* Posición de juego */}
                          <td className="p-4">
                            <span className="font-inter text-xs text-on-surface-variant">
                              {jugador.posiciones.join(" / ")}
                            </span>
                          </td>

                          {/* Resultado */}
                          <td className="p-4">
                            <span className="font-jetbrains font-bold text-on-surface">
                              {ultimo}
                            </span>
                            {ejercicio?.unidad && (
                              <span className="font-jetbrains text-xs text-on-surface-variant ml-1">
                                {ejercicio.unidad}
                              </span>
                            )}
                          </td>

                          {/* Barra relativa */}
                          <td className="p-4">
                            <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-container rounded-full transition-all duration-700"
                                style={{ width: barWidth(ultimo) }}
                              />
                            </div>
                          </td>

                          {/* Estado */}
                          <td className="p-4">
                            {neutro ? (
                              <span className="font-jetbrains text-[10px] font-bold tracking-wider text-on-surface-variant">
                                IGUAL
                              </span>
                            ) : (
                              <div
                                className={`flex items-center gap-1.5 ${
                                  positivo ? "text-primary-container" : "text-error"
                                }`}
                              >
                                {positivo ? (
                                  <TrendingUp size={13} />
                                ) : (
                                  <TrendingDown size={13} />
                                )}
                                <span className="font-jetbrains text-[10px] font-bold tracking-wider">
                                  {positivo ? "MEJORA" : "BAJA"}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Insight ─────────────────────────────────────────── */}
          <div className="mt-4 p-4 bg-primary-container/5 border border-primary-container/20 rounded-xl flex gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <div>
              <p className="font-inter font-bold text-xs text-primary uppercase mb-1">
                Staff Insight
              </p>
              <p className="font-inter text-xs text-on-surface-variant leading-relaxed">
                {esTestPersonalizado
                  ? `Los datos de "${ejercicio?.nombre}" son simulados. Asigná este test en la agenda y pedí a los jugadores que carguen sus marcas para ver resultados reales.`
                  : ranking.filter((r) => r.tendencia < 0).length > 0
                  ? `${ranking.filter((r) => r.tendencia < 0).length} jugador(es) muestran tendencia negativa en ${ejercicio?.nombre}. Considerar ajuste de carga en el próximo microciclo.`
                  : `El plantel muestra evolución positiva en ${ejercicio?.nombre}. Mantener la carga actual para el próximo microciclo.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
