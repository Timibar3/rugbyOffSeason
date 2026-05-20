"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Copy, X, Pencil, Check, ImagePlus, Lock } from "lucide-react";
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
  if (grupo === "Capacidades")
    return "bg-primary-container text-on-primary-fixed border-primary-container";
  if (grupo === "Zonas")
    return "bg-secondary text-on-secondary border-secondary";
  return "bg-surface-container-highest text-on-surface border-outline";
}

function ClaseBadge({ clase }: { clase: Clase }) {
  return (
    <span
      className={`font-jetbrains text-[9px] tracking-wider px-2 py-0.5 rounded border ${claseColor(clase)}`}
    >
      {clase}
    </span>
  );
}

// ─── Componente: inline editor de comentario ──────────────────────────────────

function ComentarioEditor({
  agendaItemId,
  comentarioInicial,
  onClose,
}: {
  agendaItemId: string;
  comentarioInicial: string;
  onClose: () => void;
}) {
  const { editarComentarioAgenda } = useMockAuth();
  const [valor, setValor] = useState(comentarioInicial);

  function handleGuardar() {
    editarComentarioAgenda(agendaItemId, valor.trim());
    onClose();
  }

  return (
    <div className="mt-3 pt-3 border-t border-outline-variant/50">
      <label className="block font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase mb-2">
        Comentario del entrenador
      </label>
      <textarea
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        rows={2}
        autoFocus
        placeholder="Ej: 3 series × 5 reps al 85% RM. Descanso 2 min."
        className="w-full bg-surface-container-low border border-primary-container/40 rounded-lg px-3 py-2 text-on-surface font-inter text-xs focus:border-primary-container focus:outline-none resize-none placeholder:text-on-surface-variant/40"
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleGuardar}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-container text-on-primary-fixed font-jetbrains text-[9px] tracking-widest font-black rounded-lg hover:opacity-90 transition-all"
        >
          <Check size={10} />
          GUARDAR
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high text-on-surface-variant font-jetbrains text-[9px] tracking-widest rounded-lg border border-outline-variant hover:border-outline transition-all"
        >
          CANCELAR
        </button>
      </div>
    </div>
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
    eliminarEjercicioPersonalizado,
  } = useMockAuth();

  // ── Estado del formulario ─────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [formTab, setFormTab] = useState<"catalogo" | "nuevo">("catalogo");

  // Pestaña "Desde catálogo"
  const [filtroFormClases, setFiltroFormClases] = useState<Clase[]>([]);
  const [newEjercicioId, setNewEjercicioId] = useState(todosLosEjercicios[0]?.id ?? "");
  const [newTargets, setNewTargets] = useState<Grupo[]>(["Plantel Completo"]);
  const [newComentario, setNewComentario] = useState("");

  // Pestaña "Nuevo ejercicio" — solo campos de catálogo, sin agenda
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<TipoItem>("ejercicio");
  const [nuevoDesc, setNuevoDesc] = useState("");
  const [nuevoUnidad, setNuevoUnidad] = useState("");
  const [nuevoClases, setNuevoClases] = useState<Clase[]>([]);
  // Éxito al guardar en catálogo: muestra flash + opción de asignar
  const [nuevoCreado, setNuevoCreado] = useState<{ id: string; nombre: string } | null>(null);
  // Imágenes del nuevo ejercicio
  const [nuevoImagenes, setNuevoImagenes] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [arrastrando, setArrastrando] = useState(false);

  // ── Filtro de clases en la lista ─────────────────────────────────────────
  const [filtroClases, setFiltroClases] = useState<Clase[]>([]);
  const [cloningId, setCloningId] = useState<string | null>(null);
  // id del item que tiene el editor de comentario abierto
  const [editandoComentarioId, setEditandoComentarioId] = useState<string | null>(null);

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

  const ejerciciosCatalogo = useMemo(() => {
    if (filtroFormClases.length === 0) return todosLosEjercicios;
    return todosLosEjercicios.filter((e) =>
      filtroFormClases.some((c) => e.clases.includes(c))
    );
  }, [todosLosEjercicios, filtroFormClases]);

  if (!usuarioActivo) return null;

  // ── Handlers ─────────────────────────────────────────────────────────────

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

  function toggleNuevoClase(c: Clase) {
    setNuevoClases((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function resetForm() {
    setShowForm(false);
    setFiltroFormClases([]);
    setNewTargets(["Plantel Completo"]);
    setNewComentario("");
    setNuevoNombre("");
    setNuevoTipo("ejercicio");
    setNuevoDesc("");
    setNuevoUnidad("");
    setNuevoClases([]);
    setNuevoCreado(null);
    setNuevoImagenes([]);
    setUrlInput("");
  }

  function handleAgregarDesdeCatalogo() {
    if (!newTargets.length || !newEjercicioId) return;
    agregarItemAgenda({
      ejercicioId: newEjercicioId,
      fecha: fechaSeleccionada,
      targets: newTargets,
      comentarioEntrenador: newComentario.trim() || undefined,
    });
    resetForm();
  }

  function handleGuardarEnCatalogo() {
    if (!nuevoNombre.trim()) return;
    const newId = `custom_ej_${Date.now()}`;
    const nombre = nuevoNombre.trim();
    agregarEjercicioPersonalizado({
      id: newId,
      nombre,
      tipo: nuevoTipo,
      descripcion: nuevoDesc.trim(),
      unidad: nuevoUnidad.trim() || undefined,
      icono: nuevoTipo === "test" ? "analytics" : "fitness_center",
      clases: nuevoClases,
      imagenes: nuevoImagenes,
      esGlobal: false,
    });
    // Mostrar flash de éxito, resetear campos para el siguiente ejercicio
    setNuevoCreado({ id: newId, nombre });
    setNuevoNombre("");
    setNuevoTipo("ejercicio");
    setNuevoDesc("");
    setNuevoUnidad("");
    setNuevoClases([]);
    setNuevoImagenes([]);
    setUrlInput("");
  }

  function handleAsignarNuevoCreado() {
    if (!nuevoCreado) return;
    setNewEjercicioId(nuevoCreado.id);
    setFiltroFormClases([]);
    setFormTab("catalogo");
    setNuevoCreado(null);
  }

  function handleAddUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setNuevoImagenes((prev) => [...prev, trimmed]);
    setUrlInput("");
  }

  function handleEliminarDelCatalogo(id: string) {
    eliminarEjercicioPersonalizado(id);
    if (newEjercicioId === id) {
      const remaining = ejerciciosCatalogo.filter((e) => e.id !== id);
      setNewEjercicioId(remaining[0]?.id ?? "");
    }
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
              onClick={() => { setFormTab("catalogo"); setNuevoCreado(null); }}
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
              + NUEVO EJERCICIO
            </button>
          </div>

          {formTab === "catalogo" ? (
            /* ── Pestaña: Desde catálogo ── */
            <div className="space-y-4">
              <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase">
                Filtrar catálogo por clase
              </p>
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
                    <div className="max-h-56 overflow-y-auto rounded-lg border border-outline-variant divide-y divide-outline-variant/40">
                      {ejerciciosCatalogo.map((e) => {
                        const seleccionado = newEjercicioId === e.id;
                        return (
                          <div
                            key={e.id}
                            onClick={() => setNewEjercicioId(e.id)}
                            className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all ${
                              seleccionado
                                ? "bg-primary-container/12 border-l-2 border-primary-container"
                                : "hover:bg-surface-container-high border-l-2 border-transparent"
                            }`}
                          >
                            {/* Tipo */}
                            <span
                              className={`flex-shrink-0 font-jetbrains text-[8px] tracking-widest px-1.5 py-0.5 rounded border ${
                                e.tipo === "test"
                                  ? "border-secondary/40 text-secondary bg-secondary/10"
                                  : "border-primary-container/40 text-primary-container bg-primary-container/10"
                              }`}
                            >
                              {e.tipo === "test" ? "TEST" : "EJE"}
                            </span>

                            {/* Origen */}
                            <span
                              className={`flex-shrink-0 font-jetbrains text-[8px] tracking-widest px-1.5 py-0.5 rounded border ${
                                e.esGlobal
                                  ? "border-outline-variant text-on-surface-variant/50 bg-surface-container-high"
                                  : "border-primary-container/25 text-primary-container/75 bg-primary-container/6"
                              }`}
                            >
                              {e.esGlobal ? "GLOBAL" : "EQUIPO"}
                            </span>

                            {/* Nombre */}
                            <span className="flex-1 font-inter text-sm text-on-surface truncate">
                              {e.nombre}
                            </span>

                            {/* Acciones */}
                            {e.esGlobal ? (
                              <span title="Ejercicio base — no se puede eliminar">
                                <Lock size={11} className="flex-shrink-0 text-on-surface-variant/30" />
                              </span>
                            ) : (
                              <button
                                onClick={(ev) => { ev.stopPropagation(); handleEliminarDelCatalogo(e.id); }}
                                className="flex-shrink-0 p-1 rounded text-on-surface-variant/50 hover:text-error hover:bg-error/10 transition-all"
                                title="Eliminar del catálogo"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

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

              {/* Comentario del entrenador */}
              <div>
                <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
                  Comentario del entrenador{" "}
                  <span className="text-on-surface-variant/50 normal-case font-normal tracking-normal">
                    (opcional)
                  </span>
                </label>
                <textarea
                  value={newComentario}
                  onChange={(e) => setNewComentario(e.target.value)}
                  rows={2}
                  placeholder="Ej: 3 series × 5 reps al 85% RM. Mínimo 10 kg de resistencia en banda."
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-on-surface font-inter text-sm focus:border-primary-container focus:outline-none resize-none placeholder:text-on-surface-variant/40"
                />
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
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-surface-container-high text-on-surface-variant font-jetbrains text-[11px] tracking-widest rounded-lg border border-outline-variant hover:border-outline transition-all"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          ) : (
            /* ── Pestaña: Nuevo ejercicio (solo catálogo) ── */
            <div className="space-y-4">

              {/* Flash de éxito */}
              {nuevoCreado && (
                <div className="flex items-center justify-between gap-3 p-3 bg-primary-container/10 border border-primary-container/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-primary-container flex-shrink-0" />
                    <p className="font-inter text-xs text-on-surface">
                      <span className="font-semibold text-primary-container">
                        {nuevoCreado.nombre}
                      </span>{" "}
                      guardado en el catálogo.
                    </p>
                  </div>
                  <button
                    onClick={handleAsignarNuevoCreado}
                    className="flex-shrink-0 px-3 py-1.5 bg-primary-container text-on-primary-fixed font-jetbrains text-[9px] tracking-widest font-black rounded-lg hover:opacity-90 transition-all whitespace-nowrap"
                  >
                    ASIGNAR A ESTE DÍA →
                  </button>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={nuevoNombre}
                    onChange={(e) => { setNuevoNombre(e.target.value); setNuevoCreado(null); }}
                    placeholder="Ej: Remo con Barra"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-on-surface font-inter text-sm focus:border-primary-container focus:outline-none placeholder:text-on-surface-variant/40"
                  />
                </div>

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

              <div>
                <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
                  Descripción{" "}
                  <span className="text-on-surface-variant/50 normal-case font-normal tracking-normal">
                    (instrucciones técnicas del movimiento)
                  </span>
                </label>
                <textarea
                  value={nuevoDesc}
                  onChange={(e) => setNuevoDesc(e.target.value)}
                  rows={3}
                  placeholder="Descripción técnica del movimiento, puntos clave de ejecución..."
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-on-surface font-inter text-sm focus:border-primary-container focus:outline-none resize-none placeholder:text-on-surface-variant/40"
                />
              </div>

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

              {/* Imágenes */}
              <div>
                <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-3">
                  Imágenes{" "}
                  <span className="text-on-surface-variant/50 normal-case font-normal tracking-normal">
                    (opcional)
                  </span>
                </label>

                {/* Zona de arrastre */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
                  onDragLeave={() => setArrastrando(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setArrastrando(false);
                    Array.from(e.dataTransfer.files)
                      .filter((f) => f.type.startsWith("image/"))
                      .forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string") {
                            setNuevoImagenes((prev) => [...prev, reader.result as string]);
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                  }}
                  className={`flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 border-dashed transition-all ${
                    arrastrando
                      ? "border-primary-container bg-primary-container/10"
                      : "border-outline-variant hover:border-outline"
                  }`}
                >
                  <ImagePlus size={18} className="text-on-surface-variant/50" />
                  <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase">
                    Arrastrá imágenes aquí
                  </p>
                </div>

                {/* Input de URL */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddUrl(); } }}
                    placeholder="https://... (URL de imagen)"
                    className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface font-inter text-sm focus:border-primary-container focus:outline-none placeholder:text-on-surface-variant/40"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    disabled={!urlInput.trim()}
                    className="px-4 py-2 bg-primary-container text-on-primary-fixed font-jetbrains text-[10px] tracking-widest font-black rounded-lg hover:opacity-90 disabled:opacity-30 transition-all"
                  >
                    AÑADIR
                  </button>
                </div>

                {/* Thumbnails */}
                {nuevoImagenes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {nuevoImagenes.map((url, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={url}
                          alt=""
                          className="w-16 h-12 object-cover rounded-lg border border-outline-variant"
                        />
                        <button
                          type="button"
                          onClick={() => setNuevoImagenes((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-surface-container-high border border-outline-variant text-on-surface-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nota informativa */}
              <p className="font-jetbrains text-[9px] tracking-wider text-on-surface-variant/60 leading-relaxed">
                El ejercicio se guardará en el catálogo. Para asignarlo a un día de la agenda,
                usá la pestaña <span className="text-on-surface-variant">DESDE CATÁLOGO</span>.
              </p>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleGuardarEnCatalogo}
                  disabled={!nuevoNombre.trim()}
                  className="px-6 py-2.5 bg-primary-container text-on-primary-fixed font-jetbrains text-[11px] tracking-widest font-black rounded-lg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  GUARDAR EN CATÁLOGO
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-surface-container-high text-on-surface-variant font-jetbrains text-[11px] tracking-widest rounded-lg border border-outline-variant hover:border-outline transition-all"
                >
                  CERRAR
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

                  {/* Clases */}
                  {item.ejercicio.clases.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.ejercicio.clases.map((c) => (
                        <ClaseBadge key={c} clase={c} />
                      ))}
                    </div>
                  )}

                  {/* Thumbnails de imágenes */}
                  {item.ejercicio.imagenes.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 mb-1">
                      <img
                        src={item.ejercicio.imagenes[0]}
                        alt=""
                        className="w-20 h-16 object-cover rounded-lg border border-outline-variant flex-shrink-0"
                      />
                      {item.ejercicio.imagenes.length > 1 && (
                        <span className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant">
                          +{item.ejercicio.imagenes.length - 1} foto{item.ejercicio.imagenes.length - 1 > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Comentario del entrenador */}
                  {item.comentarioEntrenador && editandoComentarioId !== item.id && (
                    <div className="mt-2 flex items-start gap-2 p-2.5 bg-primary-container/8 border border-primary-container/20 rounded-lg">
                      <span className="font-jetbrains text-[9px] tracking-widest text-primary-container uppercase flex-shrink-0 mt-0.5">
                        Coach
                      </span>
                      <p className="font-inter text-xs text-on-surface leading-relaxed">
                        {item.comentarioEntrenador}
                      </p>
                    </div>
                  )}

                  {/* Targets */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.targets.map((t) => (
                      <span
                        key={t}
                        className="font-jetbrains text-[9px] tracking-wider text-on-surface-variant bg-surface-container-high border border-outline-variant px-2 py-0.5 rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Editor inline de comentario */}
                  {editandoComentarioId === item.id && (
                    <ComentarioEditor
                      agendaItemId={item.id}
                      comentarioInicial={item.comentarioEntrenador ?? ""}
                      onClose={() => setEditandoComentarioId(null)}
                    />
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Editar comentario */}
                  <button
                    onClick={() =>
                      setEditandoComentarioId(
                        editandoComentarioId === item.id ? null : item.id
                      )
                    }
                    className={`p-2 rounded-lg border transition-all ${
                      editandoComentarioId === item.id || item.comentarioEntrenador
                        ? "border-primary-container/40 text-primary-container bg-primary-container/10"
                        : "border-outline-variant text-on-surface-variant hover:text-primary-container hover:border-primary-container/40"
                    }`}
                    title={item.comentarioEntrenador ? "Modificar comentario" : "Agregar comentario"}
                  >
                    <Pencil size={14} />
                  </button>

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
          <div>
            <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase">
              Con comentario
            </p>
            <p className="font-jetbrains font-bold text-xl text-on-surface">
              {items.filter((i) => i.comentarioEntrenador).length}
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
