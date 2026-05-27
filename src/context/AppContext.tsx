"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  type AgendaItem,
  type EjercicioTemplate,
  type Grupo,
  type PosicionFinal,
  type EstadoCumplimiento,
  getGruposDeJugador,
} from "@/mocks/rugbyData";
import { getFechaHoy, getLunesSemana, getDomingoSemana } from "@/lib/semana";

// Re-export para que los consumidores no importen de rugbyData
export type { AgendaItem, EjercicioTemplate, Grupo, PosicionFinal };

// ─── Tipos del contexto ───────────────────────────────────────────────────────

export type UsuarioActivo =
  | {
      tipo: "staff";
      id: string;
      nombre: string;
      iniciales: string;
      rol: "head_coach" | "entrenador";
      equipoId: string;
    }
  | {
      tipo: "jugador";
      id: string;
      nombre: string;
      iniciales: string;
      numero: number;
      posiciones: PosicionFinal[];
      rol: "jugador";
      equipoId: string;
    }
  | null;

export interface JugadorEquipo {
  id: string;
  nombre: string;
  iniciales: string;
  numero: number;
  posiciones: PosicionFinal[];
}

interface TestResultado {
  ejercicioId: string;
  fecha: string;
  valor: string;
}

interface AppState {
  usuarioActivo: UsuarioActivo;
  loadingAuth: boolean;
  fechaSeleccionada: string;
  agenda: AgendaItem[];
  todosLosEjercicios: EjercicioTemplate[];
  jugadoresEquipo: JugadorEquipo[];
  completados: Set<string>;
  resultadosTests: Record<string, string>;
  cumplimiento: Record<string, Record<string, EstadoCumplimiento>>;

  logout: () => void;
  setFechaSeleccionada: (f: string) => void;
  toggleCompletado: (ejercicioId: string, fecha: string) => void;
  isCompletado: (ejercicioId: string, fecha: string) => boolean;
  guardarResultadoTest: (r: TestResultado) => void;
  getResultadoTest: (ejercicioId: string, fecha: string) => string | undefined;
  agregarItemAgenda: (item: Omit<AgendaItem, "id">) => void;
  eliminarItemAgenda: (id: string) => void;
  clonarItemAgenda: (id: string, nuevaFecha: string) => void;
  editarComentarioAgenda: (id: string, comentario: string) => void;
  agregarEjercicioPersonalizado: (
    ej: Omit<EjercicioTemplate, "id">
  ) => Promise<string | null>;
  eliminarEjercicioPersonalizado: (id: string) => void;
}

// ─── Mappers DB → dominio ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toEjercicio(row: any): EjercicioTemplate {
  return {
    id: row.id,
    nombre: row.titulo,                       // DB: titulo → dominio: nombre
    tipo: row.tipo,
    descripcion: row.descripcion ?? "",
    unidad: row.unidad_medicion ?? undefined, // DB: unidad_medicion → dominio: unidad
    icono: "fitness_center",                  // sin columna en DB, default fijo
    clases: row.clases ?? [],
    imagenes: row.imagenes ?? [],
    esGlobal: row.es_global,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAgendaItem(row: any): AgendaItem {
  return {
    id: row.id,
    ejercicioId: row.catalogo_id,             // DB: catalogo_id → dominio: ejercicioId
    fecha: row.fecha,
    targets: [row.asignado_a as Grupo],       // DB: asignado_a (single) → targets array
    comentarioEntrenador: row.comentario_entrenador ?? undefined,
  };
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [usuarioActivo, setUsuarioActivo] = useState<UsuarioActivo>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(getFechaHoy);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [todosLosEjercicios, setTodosLosEjercicios] = useState<EjercicioTemplate[]>([]);
  const [jugadoresEquipo, setJugadoresEquipo] = useState<JugadorEquipo[]>([]);
  const [completados, setCompletados] = useState<Set<string>>(new Set());
  const [resultadosTests, setResultadosTests] = useState<Record<string, string>>({});
  const [cumplimiento, setCumplimiento] = useState<Record<string, Record<string, EstadoCumplimiento>>>({});

  // ── Cargar todos los datos del usuario ────────────────────────────────────

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED"
        ) {
          if (session?.user) {
            void cargarDatos(session.user.id);
          } else {
            limpiarEstado();
            setLoadingAuth(false);
          }
        } else if (event === "SIGNED_OUT") {
          limpiarEstado();
          setLoadingAuth(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  function limpiarEstado() {
    setUsuarioActivo(null);
    setAgenda([]);
    setTodosLosEjercicios([]);
    setJugadoresEquipo([]);
    setCompletados(new Set());
    setResultadosTests({});
    setCumplimiento({});
  }

  async function cargarDatos(userId: string) {
    // 1. Perfil
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("id, nombre_completo, rol, estado_ingreso, equipo_id")
      .eq("id", userId)
      .single();

    if (!perfil?.equipo_id || perfil.estado_ingreso !== "aprobado") {
      limpiarEstado();
      setLoadingAuth(false);
      return;
    }

    const iniciales = perfil.nombre_completo
      .split(" ")
      .map((n: string) => n[0] ?? "")
      .slice(0, 2)
      .join("")
      .toUpperCase();

    let posiciones: PosicionFinal[] = [];
    if (perfil.rol === "jugador") {
      const { data: posData } = await supabase
        .from("jugador_posiciones")
        .select("posicion")
        .eq("jugador_id", userId);
      posiciones = (posData ?? []).map((p) => p.posicion as PosicionFinal);
    }

    const ua: UsuarioActivo =
      perfil.rol === "jugador"
        ? {
            tipo: "jugador",
            id: perfil.id,
            nombre: perfil.nombre_completo,
            iniciales,
            numero: 0,
            posiciones,
            rol: "jugador",
            equipoId: perfil.equipo_id,
          }
        : {
            tipo: "staff",
            id: perfil.id,
            nombre: perfil.nombre_completo,
            iniciales,
            rol: perfil.rol as "head_coach" | "entrenador",
            equipoId: perfil.equipo_id,
          };

    setUsuarioActivo(ua);

    // 2. Catálogo: global + del equipo
    const { data: catalogoData } = await supabase
      .from("catalogo")
      .select("*")
      .or(`es_global.eq.true,equipo_id.eq.${perfil.equipo_id}`)
      .order("titulo");

    if (catalogoData) setTodosLosEjercicios(catalogoData.map(toEjercicio));

    // 3. Agenda de la semana actual
    const lunes = getLunesSemana();
    const domingo = getDomingoSemana();

    const { data: agendaData } = await supabase
      .from("agenda")
      .select("*")
      .eq("equipo_id", perfil.equipo_id)
      .gte("fecha", lunes)
      .lte("fecha", domingo);

    const agendaItems = agendaData ? agendaData.map(toAgendaItem) : [];
    setAgenda(agendaItems);

    // 4a. Para jugadores: resultados propios
    if (perfil.rol === "jugador" && agendaItems.length > 0) {
      const agendaIds = agendaItems.map((i) => i.id);
      const { data: resultadosData } = await supabase
        .from("resultados_tests")
        .select("agenda_id, realizado, resultado_numerico")
        .eq("jugador_id", userId)
        .in("agenda_id", agendaIds);

      if (resultadosData) {
        const newCompletados = new Set<string>();
        const newResultados: Record<string, string> = {};
        for (const r of resultadosData) {
          const ai = agendaItems.find((i) => i.id === r.agenda_id);
          if (!ai) continue;
          const key = `${ai.ejercicioId}|${ai.fecha}`;
          if (r.realizado) newCompletados.add(key);
          if (r.resultado_numerico != null) {
            newResultados[key] = String(r.resultado_numerico);
          }
        }
        setCompletados(newCompletados);
        setResultadosTests(newResultados);
      }
    }

    // 4b. Para staff: jugadores del equipo + cumplimiento de la semana
    if (perfil.rol !== "jugador") {
      const { data: jugadoresData } = await supabase
        .from("perfiles")
        .select("id, nombre_completo")
        .eq("equipo_id", perfil.equipo_id)
        .eq("rol", "jugador");

      if (jugadoresData?.length) {
        const jugadorIds = jugadoresData.map((j) => j.id);

        const { data: posicionesData } = await supabase
          .from("jugador_posiciones")
          .select("jugador_id, posicion")
          .in("jugador_id", jugadorIds);

        const jugadores: JugadorEquipo[] = jugadoresData.map((j) => {
          const pos = (posicionesData ?? [])
            .filter((p) => p.jugador_id === j.id)
            .map((p) => p.posicion as PosicionFinal);
          const ini = j.nombre_completo
            .split(" ")
            .map((n: string) => n[0] ?? "")
            .slice(0, 2)
            .join("")
            .toUpperCase();
          return { id: j.id, nombre: j.nombre_completo, iniciales: ini, numero: 0, posiciones: pos };
        });

        setJugadoresEquipo(jugadores);

        // Cumplimiento: cargar todos los resultados de los jugadores esta semana
        if (agendaItems.length > 0) {
          const agendaIds = agendaItems.map((i) => i.id);
          const { data: resultadosTodos } = await supabase
            .from("resultados_tests")
            .select("agenda_id, jugador_id, realizado")
            .in("jugador_id", jugadorIds)
            .in("agenda_id", agendaIds);

          const fechasUnicas = [...new Set(agendaItems.map((i) => i.fecha))];
          const cumplimientoMap: Record<string, Record<string, EstadoCumplimiento>> = {};

          for (const jugador of jugadores) {
            cumplimientoMap[jugador.id] = {};
            const gruposJugador = getGruposDeJugador(jugador.posiciones);

            for (const fecha of fechasUnicas) {
              const itemsDelDia = agendaItems.filter(
                (item) =>
                  item.fecha === fecha &&
                  item.targets.some((t) => gruposJugador.includes(t))
              );

              if (itemsDelDia.length === 0) {
                cumplimientoMap[jugador.id][fecha] = null;
              } else {
                const tieneCompletado = itemsDelDia.some((item) =>
                  (resultadosTodos ?? []).some(
                    (r) =>
                      r.agenda_id === item.id &&
                      r.jugador_id === jugador.id &&
                      r.realizado
                  )
                );
                cumplimientoMap[jugador.id][fecha] = tieneCompletado ? true : false;
              }
            }
          }

          setCumplimiento(cumplimientoMap);
        }
      }
    }

    setLoadingAuth(false);
  }

  // ── Acciones de autenticación ─────────────────────────────────────────────

  const logout = useCallback(() => {
    supabase.auth.signOut().then(() => {
      limpiarEstado();
      router.push("/login");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router]);

  // ── Jugador: completados y tests ──────────────────────────────────────────

  const toggleCompletado = useCallback(
    async (ejercicioId: string, fecha: string) => {
      if (!usuarioActivo || usuarioActivo.tipo !== "jugador") return;
      const key = `${ejercicioId}|${fecha}`;
      const wasComplete = completados.has(key);
      const nuevoEstado = !wasComplete;

      // Optimistic update
      setCompletados((prev) => {
        const next = new Set(prev);
        nuevoEstado ? next.add(key) : next.delete(key);
        return next;
      });

      const ai = agenda.find(
        (i) => i.ejercicioId === ejercicioId && i.fecha === fecha
      );
      if (!ai) {
        // Sin item en agenda — revertir
        setCompletados((prev) => {
          const next = new Set(prev);
          wasComplete ? next.add(key) : next.delete(key);
          return next;
        });
        console.warn("toggleCompletado: no se encontró agenda item para", ejercicioId, fecha);
        return;
      }

      // Upsert para marcar Y desmarcar (evita necesidad de DELETE policy)
      const { error } = await supabase.from("resultados_tests").upsert(
        {
          agenda_id: ai.id,
          jugador_id: usuarioActivo.id,
          realizado: nuevoEstado,
        },
        { onConflict: "agenda_id,jugador_id" }
      );

      if (error) {
        console.error("toggleCompletado error:", error.message, error.details);
        // Revertir optimistic update
        setCompletados((prev) => {
          const next = new Set(prev);
          wasComplete ? next.add(key) : next.delete(key);
          return next;
        });
      }
    },
    [usuarioActivo, completados, agenda, supabase]
  );

  const isCompletado = useCallback(
    (ejercicioId: string, fecha: string) =>
      completados.has(`${ejercicioId}|${fecha}`),
    [completados]
  );

  const guardarResultadoTest = useCallback(
    async ({ ejercicioId, fecha, valor }: TestResultado) => {
      if (!usuarioActivo || usuarioActivo.tipo !== "jugador") return;
      const key = `${ejercicioId}|${fecha}`;

      const ai = agenda.find(
        (i) => i.ejercicioId === ejercicioId && i.fecha === fecha
      );
      if (!ai) {
        console.warn("guardarResultadoTest: no se encontró agenda item para", ejercicioId, fecha);
        return;
      }

      const { error } = await supabase.from("resultados_tests").upsert(
        {
          agenda_id: ai.id,
          jugador_id: usuarioActivo.id,
          realizado: true,
          resultado_numerico: parseFloat(valor) || null,
        },
        { onConflict: "agenda_id,jugador_id" }
      );

      if (error) {
        console.error("guardarResultadoTest error:", error.message, error.details);
        return;
      }

      // Solo actualizar estado local si el DB write fue exitoso
      setResultadosTests((prev) => ({ ...prev, [key]: valor }));
      setCompletados((prev) => new Set([...prev, key]));
    },
    [usuarioActivo, agenda, supabase]
  );

  const getResultadoTest = useCallback(
    (ejercicioId: string, fecha: string) =>
      resultadosTests[`${ejercicioId}|${fecha}`],
    [resultadosTests]
  );

  // ── Entrenador: escritura en agenda ───────────────────────────────────────

  const agregarItemAgenda = useCallback(
    (item: Omit<AgendaItem, "id">) => {
      if (!usuarioActivo) return;
      // Cada grupo destino → una fila separada (asignado_a es scalar)
      const rows = item.targets.map((grupo) => ({
        equipo_id: usuarioActivo.equipoId,
        catalogo_id: item.ejercicioId,
        fecha: item.fecha,
        asignado_a: grupo,
        comentario_entrenador: item.comentarioEntrenador ?? null,
      }));
      void supabase
        .from("agenda")
        .insert(rows)
        .select()
        .then(({ data }) => {
          if (data) setAgenda((prev) => [...prev, ...data.map(toAgendaItem)]);
        });
    },
    [usuarioActivo, supabase]
  );

  const eliminarItemAgenda = useCallback(
    (id: string) => {
      void supabase.from("agenda").delete().eq("id", id);
      setAgenda((prev) => prev.filter((item) => item.id !== id));
    },
    [supabase]
  );

  const clonarItemAgenda = useCallback(
    (id: string, nuevaFecha: string) => {
      const original = agenda.find((item) => item.id === id);
      if (!original || !usuarioActivo) return;
      const rows = original.targets.map((grupo) => ({
        equipo_id: usuarioActivo.equipoId,
        catalogo_id: original.ejercicioId,
        fecha: nuevaFecha,
        asignado_a: grupo,
        comentario_entrenador: original.comentarioEntrenador ?? null,
      }));
      void supabase
        .from("agenda")
        .insert(rows)
        .select()
        .then(({ data }) => {
          if (data) setAgenda((prev) => [...prev, ...data.map(toAgendaItem)]);
        });
    },
    [agenda, usuarioActivo, supabase]
  );

  const editarComentarioAgenda = useCallback(
    (id: string, comentario: string) => {
      void supabase
        .from("agenda")
        .update({ comentario_entrenador: comentario || null })
        .eq("id", id);
      setAgenda((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, comentarioEntrenador: comentario || undefined }
            : item
        )
      );
    },
    [supabase]
  );

  // ── Entrenador: escritura en catálogo ─────────────────────────────────────

  const agregarEjercicioPersonalizado = useCallback(
    async (ej: Omit<EjercicioTemplate, "id">): Promise<string | null> => {
      if (!usuarioActivo) return null;
      const { data } = await supabase
        .from("catalogo")
        .insert({
          equipo_id: usuarioActivo.equipoId,
          tipo: ej.tipo,
          titulo: ej.nombre,                  // dominio: nombre → DB: titulo
          descripcion: ej.descripcion,
          unidad_medicion: ej.unidad ?? null, // dominio: unidad → DB: unidad_medicion
          clases: ej.clases,
          imagenes: ej.imagenes,
          es_global: false,
        })
        .select()
        .single();

      if (data) {
        setTodosLosEjercicios((prev) => [...prev, toEjercicio(data)]);
        return data.id as string;
      }
      return null;
    },
    [usuarioActivo, supabase]
  );

  const eliminarEjercicioPersonalizado = useCallback(
    (id: string) => {
      void supabase
        .from("agenda")
        .delete()
        .eq("catalogo_id", id)              // DB: catalogo_id
        .then(() =>
          supabase.from("catalogo").delete().eq("id", id).eq("es_global", false)
        );
      setTodosLosEjercicios((prev) => prev.filter((e) => e.id !== id));
      setAgenda((prev) => prev.filter((item) => item.ejercicioId !== id));
    },
    [supabase]
  );

  // ── Value ─────────────────────────────────────────────────────────────────

  const value = useMemo<AppState>(
    () => ({
      usuarioActivo,
      loadingAuth,
      fechaSeleccionada,
      agenda,
      todosLosEjercicios,
      jugadoresEquipo,
      completados,
      resultadosTests,
      cumplimiento,
      logout,
      setFechaSeleccionada,
      toggleCompletado,
      isCompletado,
      guardarResultadoTest,
      getResultadoTest,
      agregarItemAgenda,
      eliminarItemAgenda,
      clonarItemAgenda,
      editarComentarioAgenda,
      agregarEjercicioPersonalizado,
      eliminarEjercicioPersonalizado,
    }),
    [
      usuarioActivo,
      loadingAuth,
      fechaSeleccionada,
      agenda,
      todosLosEjercicios,
      jugadoresEquipo,
      completados,
      resultadosTests,
      cumplimiento,
      logout,
      toggleCompletado,
      isCompletado,
      guardarResultadoTest,
      getResultadoTest,
      agregarItemAgenda,
      eliminarItemAgenda,
      clonarItemAgenda,
      editarComentarioAgenda,
      agregarEjercicioPersonalizado,
      eliminarEjercicioPersonalizado,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext debe usarse dentro de AppProvider");
  return ctx;
}
