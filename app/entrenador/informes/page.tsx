"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Star, AlertTriangle } from "lucide-react";
import {
  JUGADORES,
  METRICAS_HISTORICAS,
  EJERCICIOS_TEMPLATE,
  getGruposDeJugador,
  Grupo,
} from "@/mocks/rugbyData";

// ─── Árbol de jerarquías para los filtros ─────────────────────────────────────

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
          <span className="text-xs text-on-surface-variant">{expandido ? "▾" : "▸"}</span>
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

// ─── Página ───────────────────────────────────────────────────────────────────

const TESTS = EJERCICIOS_TEMPLATE.filter((e) => e.tipo === "test");

export default function InformesPage() {
  const [grupoFiltro, setGrupoFiltro] = useState<Grupo>("Plantel Completo");
  const [testId, setTestId] = useState(TESTS[0]?.id ?? "test1");

  const ejercicio = TESTS.find((t) => t.id === testId);
  const metrica = METRICAS_HISTORICAS.find((m) => m.testId === testId);

  // Jugadores filtrados por grupo
  const jugadoresFiltrados = useMemo(() => {
    if (grupoFiltro === "Plantel Completo") return JUGADORES;
    return JUGADORES.filter((j) =>
      getGruposDeJugador(j.posiciones).includes(grupoFiltro)
    );
  }, [grupoFiltro]);

  // Ranking: último valor de cada jugador, ordenado
  const ranking = useMemo(() => {
    if (!metrica) return [];
    const items = jugadoresFiltrados.map((j) => {
      const valores = metrica.porJugador[j.id] ?? [];
      const ultimo = valores.at(-1) ?? 0;
      const anterior = valores.at(-2) ?? ultimo;
      const tendencia = testId === "test3"
        ? anterior - ultimo // para tiempo: menor es mejor
        : ultimo - anterior;
      return { jugador: j, ultimo, tendencia };
    });
    // Ordenar: para tiempo (test3) menor es mejor, para el resto mayor es mejor
    return items.sort((a, b) =>
      testId === "test3" ? a.ultimo - b.ultimo : b.ultimo - a.ultimo
    );
  }, [jugadoresFiltrados, metrica, testId]);

  // Stats globales
  const promedioEquipo = metrica?.promedioEquipo.at(-1) ?? 0;
  const maxValor = ranking[0]?.ultimo ?? 0;
  const minValor = ranking.at(-1)?.ultimo ?? 0;

  // Barra de progreso normalizada
  function barWidth(valor: number): string {
    if (maxValor === minValor) return "100%";
    const pct = ((valor - minValor) / (maxValor - minValor)) * 100;
    return `${Math.max(pct, 8).toFixed(0)}%`;
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

      {/* ── Métricas hero ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-surface-container-high p-5 border-l-4 border-primary-container rounded-r-xl">
          <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase mb-1">
            Promedio Equipo
          </p>
          <p className="font-jetbrains font-bold text-xl text-primary">
            {promedioEquipo}
            <span className="text-xs font-normal text-on-surface-variant ml-1">
              {ejercicio?.unidad}
            </span>
          </p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp size={11} className="text-primary-container" />
            <span className="font-jetbrains text-[9px] text-primary-container">
              +2.1% vs semana anterior
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
              {ejercicio?.unidad}
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
        {/* Sidebar filtros */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-surface-container border border-outline-variant rounded-xl p-5 sticky top-24">
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

            {/* Selector de métrica */}
            <div className="mt-6 pt-5 border-t border-outline-variant">
              <h4 className="font-jetbrains text-[10px] tracking-[0.12em] text-on-surface-variant uppercase mb-3">
                Métrica
              </h4>
              <div className="space-y-2">
                {TESTS.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <div
                      onClick={() => setTestId(t.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                        testId === t.id
                          ? "bg-primary-container border-primary-container"
                          : "border-outline-variant group-hover:border-outline"
                      }`}
                    >
                      {testId === t.id && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#161e00"
                          strokeWidth={3.5}
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span
                      onClick={() => setTestId(t.id)}
                      className={`font-inter text-xs cursor-pointer ${
                        testId === t.id
                          ? "text-primary font-medium"
                          : "text-on-surface-variant group-hover:text-primary"
                      }`}
                    >
                      {t.nombre}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Tabla de ranking */}
        <div className="flex-1">
          <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
            {/* Header tabla */}
            <div className="p-5 border-b border-outline-variant bg-white/5 flex justify-between items-center">
              <div>
                <h3 className="font-jetbrains text-[11px] tracking-widest text-primary uppercase">
                  Ranking · {ejercicio?.nombre}
                </h3>
                <p className="font-inter text-xs text-on-surface-variant mt-0.5">
                  {grupoFiltro} · {jugadoresFiltrados.length} jugadores
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
                        Resultado
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

                      return (
                        <tr
                          key={jugador.id}
                          className="hover:bg-primary-container/5 transition-colors group"
                        >
                          {/* Posición ranking */}
                          <td className="p-4">
                            <span
                              className={`font-jetbrains font-bold text-sm ${
                                esTop ? "text-primary-container" : "text-on-surface-variant"
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

                          {/* Posición */}
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
                            <span className="font-jetbrains text-xs text-on-surface-variant ml-1">
                              {ejercicio?.unidad}
                            </span>
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Insight */}
          <div className="mt-4 p-4 bg-primary-container/5 border border-primary-container/20 rounded-xl flex gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <div>
              <p className="font-inter font-bold text-xs text-primary uppercase mb-1">
                Staff Insight
              </p>
              <p className="font-inter text-xs text-on-surface-variant leading-relaxed">
                {ranking.filter((r) => r.tendencia < 0).length > 0
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
