"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Copy, X } from "lucide-react";
import { useMockAuth } from "@/context/MockAuthContext";
import { getItemsUnicosPorDia } from "@/lib/dedup";
import {
  CLASES_DISPONIBLES,
  DIAS_SEMANA,
  FECHA_HOY,
  Clase,
  Grupo,
} from "@/mocks/rugbyData";
import type { TipoItem } from "@/mocks/rugbyData";

// ─── Constantes ───────────────────────────────────────────────────────────────

const GRUPOS_DISPONIBLES: Grupo[] = [
  "Plantel Completo",
  "Forwards",
  "Backs",
  "1ra Línea",
  "2da Línea",
  "3ra Línea",
  "Medio Scrum",
  "Apertura",
  "1er Centro",
  "2do Centro",
  "Wing",
  "Fullback",
];

// Color coding by clase group
function claseColor(clase: Clase): string {
  const grupo = CLASES_DISPONIBLES.find((cg) => cg.clases.includes(clase))?.grupo;
  if (grupo === "Capacidades")
    return "bg-primary-container/15 text-primary-container border-primary-container/30";
  if (grupo === "Zonas")
    return "bg-secondary-container/20 text-secondary border-secondary/30";
  return "bg-surface-container-high text-on-surface-variant border-outline-variant";
}

function claseFiltroActivo(clase: Clase): string {
  const grupo = CLASES_DISPONIBLES.find((cg) => cg.clases.includes(clase))?.grupo;
  if (grupo === "Capacidades") return "bg-primary-container text-on-primary-fixed border-primary-container";
  if (grupo === "Zonas") return "bg-secondary text-on-secondary border-secondary";
  return "bg-surface-container-highest text-on-surface border-outline";
}

// ─── Componente: badge de clase ───────────────────────────────────────────────

function ClaseBadge({ clase }: { clase: Clase }) {
  return (
    <span
      className={`font-jetbrains text-[9px] tracking-wider px-2 py-0.5 rounded border ${claseColor(clase)}`}
    >
      {clase}
    </span>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function EntrenadorAgendaPage() {
  const {
    usuarioActivo,
    fechaSeleccionada,
    setFechaSeleccionada,
    agenda,
    todosLosEjercicios,
    eliminarItemAgenda,
    clonarItemAgenda,
    agregarItemAgenda,
    agregarEjercicioPersonalizado,
  } = useMockAuth();

  // ── Estado del formulario ────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [formTab, setFormTab] = useState<"catalogo" | "nuevo">("catalogo");

  // Pestaña "Desde catálogo"
  const [filtroFormClases, setFiltroFormClases] = useState<Clase[]>([]);
  const [newEjercicioId, setNewEjercicioId] = useState(todosLosEjercicios[0]?.id ?? "");
  const [newTargets, setNewTargets] = useState<Grupo[]>(["Plantel Completo"]);

  // Pestaña "Nuevo ejercicio"
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<TipoItem>("ejercicio");
  const [nuevoDesc, setNuevoDesc] = useState("");
  const [nuevoUnidad, setNuevoUnidad] = useState("");
  const [nuevoClases, setNuevoClases] = useState<Clase[]>([]);
  const [nuevoTargets, setNuevoTargets] = useState<Grupo[]>(["Plantel Completo"]);

  // ── Filtro de clases en la lista ─────────────────────────────────────────────
  const [filtroClases, setFiltroClases] = useState<Clase[]>([]);
  const [cloningId, setCloningId] = useState<string | null>(null);

  const items = useMemo(
    () => getItemsUnicosPorDia(fechaSeleccionada, agenda, todosLosEjercicios),
    [fechaSeleccionada, agenda, todosLosEjercicios]
  );

  const itemsFiltrados = useMemo(() => {
    if (filtroClases.length === 0) return items;
    return items.filter((item) =>
      filtroClases.some((c) => item.ejercicio.clases.includes(c))
    );
  }, [items, filtroClases]);

  const diasClone = DIAS_SEMANA.filter((d) => d.fecha !== fechaSeleccionada);

  // Ejercicios del catálogo filtrados por clase (para el formulario)
  const ejerciciosCatalogo = useMemo(() => {
    if (filtroFormClases.length === 0) return todosLosEjercicios;
    return todosLosEjercicios.filter((e) =>
      filtroFormClases.some((c) => e.clases.includes(c))
    );
  }, [todosLosEjercicios, filtroFormClases]);

  if (!usuarioActivo) return null;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function toggleFiltro(c: Clase) {
    setFiltroClases((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function toggleFiltroForm(c: Clase) {
    setFiltroFormClases((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function toggleTarget(g: Grupo) {
    setNewTargets((prev) =>
      prev.includes(g) ? prev.filter((t) => t !== g) : [...prev, g]
    );
  }

  function toggleNuevoTarget(g: Grupo) {
    setNuevoTargets((prev) =>
      prev.includes(g) ? prev.filter((t) => t !== g) : [...prev, g]
    );
  }

  function toggleNuevoClase(c: Clase) {
    setNuevoClases((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function handleAgregarDesdeCatalogo() {
    if (!newTargets.length || !newEjercicioId) return;
    agregarItemAgenda({
      ejercicioId: newEjercicioId,
      fecha: fechaSeleccionada,
      targets: newTargets,
    });
    setShowForm(false);
    setFiltroFormClases([]);
    setNewTargets(["Plantel Completo"]);
  }

  function handleCrearNuevo() {
    if (!nuevoNombre.trim() || !nuevoTargets.length) return;
    const newId = `custom_ej_${Date.now()}`;
    agregarEjercicioPersonalizado({
      id: newId,
      nombre: nuevoNombre.trim(),
      tipo: nuevoTipo,
      descripcion: nuevoDesc.trim(),
      unidad: nuevoUnidad.trim() || undefined,
      icono: nuevoTipo === "test" ? "analytics" : "fitness_center",
      clases: nuevoClases,
    });
    agregarItemAgenda({
      ejercicioId: newId,
      fecha: fechaSeleccionada,
      targets: nuevoTargets,
    });
    setShowForm(false);
    setNuevoNombre("");
    setNuevoDesc("");
    setNuevoUnidad("");
    setNuevoClases([]);
    setNuevoTargets(["Plantel Completo"]);
  }

  function handleClone(id: string, fecha: string) {
    clonarItemAgenda(id, fecha);
    setCloningId(null);
  }

  const labelDia = DIAS_SEMANA.find((d) => d.fecha === fechaSeleccionada);

  return (
    <div className="p-6 md:p-[40px]">
      {/* ── Encabezado ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="font-jetbrains text-[10px] tracking-[0.15em] text-on-surface-variant uppercase mb-1">
            Staff · Planificación
          </p>
          <h1
            className="font-inter font-black text-2xl md:text-3xl text-primary"
            style={{ letterSpacing: "-0.01em" }}
          >
            Planificador
          </h1>
        </div>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setFormTab("catalogo");
          }}
          className="flex items-center gap-2 px-5 py-3 bg-primary-container text-on-primary-fixed font-jetbrains text-[11px] tracking-widest font-black rounded-lg hover:opacity-90 active:scale-[0.98] transition-all self-start md:self-auto"
        >
          <Plus size={16} />
          AGREGAR EJERCICIO
        </button>
      </div>

      {/* ── Selector de días ──────────────────────────────────────── */}
      <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar pb-2">
        {DIAS_SEMANA.map((dia) => {
          const esHoy = dia.fecha === FECHA_HOY;
          const sel = dia.fecha === fechaSeleccionada;
          return (
            <button
              key={dia.fecha}
              onClick={() => setFechaSeleccionada(dia.fecha)}
              className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-lg border transition-all ${
                sel
                  ? "border-primary-container bg-surface-container-high neon-glow text-primary-container"
                  : esHoy
                  ? "border-outline bg-surface-container-low text-on-surface"
                  : "border-outline-variant bg-surface-container-low text-on-surface-variant opacity-70"
              }`}
            >
              <span className="font-jetbrains text-[10px] tracking-widest">
                {dia.label}
              </span>
              <span className="font-jetbrains font-bold text-base mt-0.5">
                {dia.numero}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Formulario ────────────────────────────────────────────── */}
      {showForm && (
        <div className="mb-6 p-6 bg-surface-container border border-primary-container/40 rounded-xl">
          {/* Tabs */}
          <div className="flex gap-1 mb-5 border-b border-outline-variant pb-1">
            <button
              onClick={() => setFormTab("catalogo")}
              className={`px-4 py-2 font-jetbrains text-[10px] tracking-widest rounded-t-lg transition-all ${
                formTab === "catalogo"
                  ? "text-primary-container border-b-2 border-primary-container"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              DESDE CATÁLOGO
            </button>
            <button
              onClick={() => setFormTab("nuevo")}
              className={`px-4 py-2 font-jetbrains text-[10px] tracking-widest rounded-t-lg transition-all ${
                formTab === "nuevo"
                  ? "text-primary-container border-b-2 border-primary-container"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              NUEVO EJERCICIO
            </button>
          </div>

          {formTab === "catalogo" ? (
            /* ── Pestaña: Desde catálogo ── */
            <div className="space-y-4">
              <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase">
                Filtrar catálogo por clase
              </p>
              {/* Filtro de clases para el catálogo */}
              <div className="space-y-2">
                {CLASES_DISPONIBLES.map((cg) => (
                  <div key={cg.grupo} className="flex flex-wrap gap-1.5 items-center">
                    <span className="font-jetbrains text-[8px] tracking-widest text-on-surface-variant/50 uppercase w-20 flex-shrink-0">
                      {cg.grupo}
                    </span>
                    {cg.clases.map((c) => {
                      const activo = filtroFormClases.includes(c);
                      return (
                        <button
                          key={c}
                          onClick={() => toggleFiltroForm(c)}
                          className={`px-2.5 py-1 rounded border font-jetbrains text-[9px] tracking-wider transition-all ${
                            activo ? claseFiltroActivo(c) : claseColor(c)
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Dropdown de ejercicios filtrado */}
                <div>
                  <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
                    Ejercicio / Test{" "}
                    {filtroFormClases.length > 0 && (
                      <span className="text-primary-container">
                        ({ejerciciosCatalogo.length} resultados)
                      </span>
                    )}
                  </label>
                  {ejerciciosCatalogo.length === 0 ? (
                    <p className="text-on-surface-variant text-xs py-2">
                      Sin coincidencias para las clases seleccionadas.
                    </p>
                  ) : (
                    <select
                      value={newEjercicioId}
                      onChange={(e) => setNewEjercicioId(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-on-surface font-inter text-sm focus:border-primary-container focus:outline-none"
                    >
                      {ejerciciosCatalogo.map((e) => (
                        <option key={e.id} value={e.id}>
                          [{e.tipo === "test" ? "TEST" : "EJE"}] {e.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Targets */}
                <div>
                  <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
                    Asignar a
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {GRUPOS_DISPONIBLES.map((g) => (
                      <button
                        key={g}
                        onClick={() => toggleTarget(g)}
                        className={`px-2.5 py-1 rounded font-jetbrains text-[9px] tracking-wider border transition-all ${
                          newTargets.includes(g)
                            ? "bg-primary-container text-on-primary-fixed border-primary-container"
                            : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-outline"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAgregarDesdeCatalogo}
                  disabled={!newTargets.length || ejerciciosCatalogo.length === 0}
                  className="px-6 py-2.5 bg-primary-container text-on-primary-fixed font-jetbrains text-[11px] tracking-widest font-black rounded-lg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  CONFIRMAR
                </button>
                <button
                  onClick={() => { setShowForm(false); setFiltroFormClases([]); }}
                  className="px-6 py-2.5 bg-surface-container-high text-on-surface-variant font-jetbrains text-[11px] tracking-widest rounded-lg border border-outline-variant hover:border-outline transition-all"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          ) : (
            /* ── Pestaña: Nuevo ejercicio ── */
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Ej: Remo con Barra"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-on-surface font-inter text-sm focus:border-primary-container focus:outline-none placeholder:text-on-surface-variant/40"
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
                    Tipo *
                  </label>
                  <div className="flex gap-2">
                    {(["ejercicio", "test"] as TipoItem[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNuevoTipo(t)}
                        className={`flex-1 py-2.5 rounded-lg border font-jetbrains text-[10px] tracking-widest transition-all ${
                          nuevoTipo === t
                            ? t === "test"
                              ? "bg-secondary text-on-secondary border-secondary"
                              : "bg-primary-container text-on-primary-fixed border-primary-container"
                            : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-outline"
                        }`}
                      >
                        {t === "test" ? "TEST" : "EJERCICIO"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
                  Descripción / Instrucciones
                </label>
                <textarea
                  value={nuevoDesc}
                  onChange={(e) => setNuevoDesc(e.target.value)}
                  rows={3}
                  placeholder="Instrucciones de ejecución, series, repeticiones..."
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-on-surface font-inter text-sm focus:border-primary-container focus:outline-none resize-none placeholder:text-on-surface-variant/40"
                />
              </div>

              {/* Unidad (solo para tests) */}
              {nuevoTipo === "test" && (
                <div className="md:w-1/2">
                  <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
                    Unidad de medición
                  </label>
                  <input
                    type="text"
                    value={nuevoUnidad}
                    onChange={(e) => setNuevoUnidad(e.target.value)}
                    placeholder="Ej: metros, kg, seg"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-on-surface font-inter text-sm focus:border-primary-container focus:outline-none placeholder:text-on-surface-variant/40"
                  />
                </div>
              )}

              {/* Clases */}
              <div>
                <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-3">
                  Clases{" "}
                  <span className="text-on-surface-variant/50 normal-case font-normal tracking-normal">
                    (seleccioná todas las que apliquen)
                  </span>
                </label>
                <div className="space-y-2.5">
                  {CLASES_DISPONIBLES.map((cg) => (
                    <div key={cg.grupo} className="flex flex-wrap gap-1.5 items-center">
                      <span className="font-jetbrains text-[8px] tracking-widest text-on-surface-variant/50 uppercase w-20 flex-shrink-0">
                        {cg.grupo}
                      </span>
                      {cg.clases.map((c) => {
                        const activo = nuevoClases.includes(c);
                        return (
                          <button
                            key={c}
                            onClick={() => toggleNuevoClase(c)}
                            className={`px-2.5 py-1 rounded border font-jetbrains text-[9px] tracking-wider transition-all ${
                              activo ? claseFiltroActivo(c) : claseColor(c)
                            }`}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Targets para asignación */}
              <div>
                <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
                  Asignar también al día {labelDia?.label} {labelDia?.numero}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {GRUPOS_DISPONIBLES.map((g) => (
                    <button
                      key={g}
                      onClick={() => toggleNuevoTarget(g)}
                      className={`px-2.5 py-1 rounded font-jetbrains text-[9px] tracking-wider border transition-all ${
                        nuevoTargets.includes(g)
                          ? "bg-primary-container text-on-primary-fixed border-primary-container"
                          : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-outline"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCrearNuevo}
                  disabled={!nuevoNombre.trim() || !nuevoTargets.length}
                  className="px-6 py-2.5 bg-primary-container text-on-primary-fixed font-jetbrains text-[11px] tracking-widest font-black rounded-lg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  CREAR Y AGREGAR
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 bg-surface-container-high text-on-surface-variant font-jetbrains text-[11px] tracking-widest rounded-lg border border-outline-variant hover:border-outline transition-all"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Barra de filtro de clases ──────────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase">
            Filtrar por clase
          </span>
          {filtroClases.length > 0 && (
            <button
              onClick={() => setFiltroClases([])}
              className="flex items-center gap-1 font-jetbrains text-[9px] tracking-wider text-on-surface-variant hover:text-primary-container transition-colors"
            >
              <X size={10} />
              LIMPIAR
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
          {CLASES_DISPONIBLES.flatMap((cg) =>
            cg.clases.map((c) => {
              const activo = filtroClases.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleFiltro(c)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded border font-jetbrains text-[9px] tracking-wider transition-all ${
                    activo ? claseFiltroActivo(c) : claseColor(c)
                  }`}
                >
                  {c}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Lista de ejercicios del día ────────────────────────────── */}
      {itemsFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-outline-variant rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center mb-3">
            <span className="text-xl">📋</span>
          </div>
          <p className="font-inter font-semibold text-on-surface mb-1">
            {filtroClases.length > 0
              ? "Sin coincidencias para los filtros activos"
              : "Sin ejercicios planificados"}
          </p>
          <p className="font-jetbrains text-[11px] text-on-surface-variant">
            {filtroClases.length > 0
              ? "Probá cambiando los filtros de clase"
              : "Usá el botón de arriba para agregar"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {itemsFiltrados.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container border border-outline-variant rounded-xl p-5 hover:border-outline transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`font-jetbrains text-[9px] tracking-widest px-2 py-0.5 rounded border ${
                        item.ejercicio.tipo === "test"
                          ? "border-secondary/40 text-secondary bg-secondary-container/20"
                          : "border-primary-container/40 text-primary-container bg-primary-container/10"
                      }`}
                    >
                      {item.ejercicio.tipo === "test" ? "TEST" : "EJE"}
                    </span>
                    <h3 className="font-inter font-semibold text-sm text-on-surface truncate">
                      {item.ejercicio.nombre}
                    </h3>
                  </div>

                  <p className="text-on-surface-variant text-xs line-clamp-1 mb-2">
                    {item.ejercicio.descripcion}
                  </p>

                  {/* Clases del ejercicio */}
                  {item.ejercicio.clases.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.ejercicio.clases.map((c) => (
                        <ClaseBadge key={c} clase={c} />
                      ))}
                    </div>
                  )}

                  {/* Targets */}
                  <div className="flex flex-wrap gap-1">
                    {item.targets.map((t) => (
                      <span
                        key={t}
                        className="font-jetbrains text-[9px] tracking-wider text-on-surface-variant bg-surface-container-high border border-outline-variant px-2 py-0.5 rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Clonar */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setCloningId(cloningId === item.id ? null : item.id)
                      }
                      className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary-container hover:border-primary-container/40 transition-all"
                      title="Clonar a otro día"
                    >
                      <Copy size={14} />
                    </button>
                    {cloningId === item.id && (
                      <div className="absolute right-0 top-full mt-1 z-20 bg-surface-container-high border border-outline-variant rounded-xl shadow-lg p-2 min-w-[140px]">
                        <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase px-2 py-1 mb-1">
                          Copiar al:
                        </p>
                        {diasClone.map((d) => (
                          <button
                            key={d.fecha}
                            onClick={() => handleClone(item.id, d.fecha)}
                            className="w-full text-left px-3 py-2 rounded-lg font-jetbrains text-[10px] text-on-surface hover:bg-surface-container-highest hover:text-primary-container transition-colors"
                          >
                            {d.label} {d.numero}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Eliminar */}
                  <button
                    onClick={() => eliminarItemAgenda(item.id)}
                    className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-error hover:border-error/40 transition-all"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Resumen del día ────────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="mt-6 p-4 bg-surface-container border border-outline-variant rounded-xl flex gap-6">
          <div>
            <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase">
              Total
            </p>
            <p className="font-jetbrains font-bold text-xl text-primary">
              {items.length}
            </p>
          </div>
          <div>
            <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase">
              Ejercicios
            </p>
            <p className="font-jetbrains font-bold text-xl text-primary-container">
              {items.filter((i) => i.ejercicio.tipo === "ejercicio").length}
            </p>
          </div>
          <div>
            <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase">
              Tests
            </p>
            <p className="font-jetbrains font-bold text-xl text-secondary">
              {items.filter((i) => i.ejercicio.tipo === "test").length}
            </p>
          </div>
          {filtroClases.length > 0 && (
            <div>
              <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase">
                Visibles
              </p>
              <p className="font-jetbrains font-bold text-xl text-on-surface">
                {itemsFiltrados.length}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
