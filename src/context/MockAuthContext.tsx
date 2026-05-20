"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  AGENDA,
  AgendaItem,
  CUMPLIMIENTO_SEMANAL,
  EjercicioTemplate,
  EJERCICIOS_TEMPLATE,
  EstadoCumplimiento,
  FECHA_HOY,
  Jugador,
  JUGADORES,
  Rol,
  STAFF,
  StaffUser,
} from "@/mocks/rugbyData";

// ─── Tipos del contexto ───────────────────────────────────────────────────────

export type UsuarioActivo =
  | (Jugador & { tipo: "jugador" })
  | (StaffUser & { tipo: "staff" })
  | null;

interface TestResultado {
  ejercicioId: string;
  fecha: string;
  valor: string;
}

interface MockAuthState {
  usuarioActivo: UsuarioActivo;
  fechaSeleccionada: string;

  // Agenda en memoria (mutable)
  agenda: AgendaItem[];

  // Catálogo de ejercicios (base + personalizados)
  todosLosEjercicios: EjercicioTemplate[];

  // Items completados: Set de "ejercicioId|fecha|jugadorId"
  completados: Set<string>;

  // Resultados de tests: key = "ejercicioId|fecha|jugadorId"
  resultadosTests: Record<string, string>;

  // Cumplimiento semanal en memoria
  cumplimiento: typeof CUMPLIMIENTO_SEMANAL;

  // Acciones
  login: (id: string) => void;
  logout: () => void;
  setFechaSeleccionada: (fecha: string) => void;
  toggleCompletado: (ejercicioId: string, fecha: string) => void;
  isCompletado: (ejercicioId: string, fecha: string) => boolean;
  guardarResultadoTest: (resultado: TestResultado) => void;
  getResultadoTest: (ejercicioId: string, fecha: string) => string | undefined;
  agregarItemAgenda: (item: Omit<AgendaItem, "id">) => void;
  eliminarItemAgenda: (id: string) => void;
  clonarItemAgenda: (id: string, nuevaFecha: string) => void;
  editarComentarioAgenda: (id: string, comentario: string) => void;
  agregarEjercicioPersonalizado: (ej: EjercicioTemplate) => void;
  eliminarEjercicioPersonalizado: (id: string) => void;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const MockAuthContext = createContext<MockAuthState | null>(null);

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [usuarioActivo, setUsuarioActivo] = useState<UsuarioActivo>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(FECHA_HOY);
  const [agenda, setAgenda] = useState<AgendaItem[]>(AGENDA);
  const [ejerciciosPersonalizados, setEjerciciosPersonalizados] = useState<EjercicioTemplate[]>([]);
  const [completados, setCompletados] = useState<Set<string>>(new Set());
  const [resultadosTests, setResultadosTests] = useState<
    Record<string, string>
  >({});
  const [cumplimiento, setCumplimiento] = useState(CUMPLIMIENTO_SEMANAL);

  const todosLosEjercicios = useMemo(
    () => [...EJERCICIOS_TEMPLATE, ...ejerciciosPersonalizados],
    [ejerciciosPersonalizados]
  );

  const login = useCallback((id: string) => {
    // Resetear la fecha al día actual en cada cambio de rol para que
    // ambas vistas (jugador y entrenador) arranquen desde el mismo punto.
    setFechaSeleccionada(FECHA_HOY);
    const jugador = JUGADORES.find((j) => j.id === id);
    if (jugador) {
      setUsuarioActivo({ ...jugador, tipo: "jugador" });
      return;
    }
    const staff = STAFF.find((s) => s.id === id);
    if (staff) {
      setUsuarioActivo({ ...staff, tipo: "staff" });
    }
  }, []);

  const logout = useCallback(() => {
    setUsuarioActivo(null);
  }, []);

  const toggleCompletado = useCallback(
    (ejercicioId: string, fecha: string) => {
      if (!usuarioActivo) return;
      const key = `${ejercicioId}|${fecha}|${usuarioActivo.id}`;
      setCompletados((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
          // Actualizar cumplimiento semanal cuando se marca como completado
          setCumplimiento((prevC) => ({
            ...prevC,
            [usuarioActivo.id]: {
              ...(prevC[usuarioActivo.id] ?? {}),
              [fecha]: true,
            },
          }));
        }
        return next;
      });
    },
    [usuarioActivo]
  );

  const isCompletado = useCallback(
    (ejercicioId: string, fecha: string) => {
      if (!usuarioActivo) return false;
      return completados.has(`${ejercicioId}|${fecha}|${usuarioActivo.id}`);
    },
    [completados, usuarioActivo]
  );

  const guardarResultadoTest = useCallback(
    ({ ejercicioId, fecha, valor }: TestResultado) => {
      if (!usuarioActivo) return;
      const key = `${ejercicioId}|${fecha}|${usuarioActivo.id}`;
      setResultadosTests((prev) => ({ ...prev, [key]: valor }));
    },
    [usuarioActivo]
  );

  const getResultadoTest = useCallback(
    (ejercicioId: string, fecha: string) => {
      if (!usuarioActivo) return undefined;
      return resultadosTests[`${ejercicioId}|${fecha}|${usuarioActivo.id}`];
    },
    [resultadosTests, usuarioActivo]
  );

  const agregarItemAgenda = useCallback(
    (item: Omit<AgendaItem, "id">) => {
      const newId = `custom_${Date.now()}`;
      setAgenda((prev) => [...prev, { ...item, id: newId }]);
    },
    []
  );

  const eliminarItemAgenda = useCallback((id: string) => {
    setAgenda((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clonarItemAgenda = useCallback(
    (id: string, nuevaFecha: string) => {
      const original = agenda.find((item) => item.id === id);
      if (!original) return;
      agregarItemAgenda({
        ejercicioId: original.ejercicioId,
        fecha: nuevaFecha,
        targets: original.targets,
        comentarioEntrenador: original.comentarioEntrenador,
      });
    },
    [agenda, agregarItemAgenda]
  );

  const editarComentarioAgenda = useCallback(
    (id: string, comentario: string) => {
      setAgenda((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, comentarioEntrenador: comentario || undefined }
            : item
        )
      );
    },
    []
  );

  const agregarEjercicioPersonalizado = useCallback(
    (ej: EjercicioTemplate) => {
      setEjerciciosPersonalizados((prev) => [...prev, ej]);
    },
    []
  );

  const eliminarEjercicioPersonalizado = useCallback((id: string) => {
    setEjerciciosPersonalizados((prev) => prev.filter((e) => e.id !== id));
    // Limpiar items de agenda que quedaron huérfanos
    setAgenda((prev) => prev.filter((item) => item.ejercicioId !== id));
  }, []);

  const value = useMemo<MockAuthState>(
    () => ({
      usuarioActivo,
      fechaSeleccionada,
      agenda,
      todosLosEjercicios,
      completados,
      resultadosTests,
      cumplimiento,
      login,
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
      fechaSeleccionada,
      agenda,
      todosLosEjercicios,
      completados,
      resultadosTests,
      cumplimiento,
      login,
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

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

// ─── Hook de acceso ───────────────────────────────────────────────────────────

export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error("useMockAuth debe usarse dentro de MockAuthProvider");
  return ctx;
}
