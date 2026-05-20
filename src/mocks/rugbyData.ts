// ─── Tipos base ──────────────────────────────────────────────────────────────

export type Rol = "jugador" | "entrenador" | "head_coach";

export type PosicionFinal =
  | "Pilar Izquierdo"
  | "Hooker"
  | "Pilar Derecho"
  | "Segunda Línea"
  | "Ala"
  | "Octavo"
  | "Medio Scrum"
  | "Apertura"
  | "Primer Centro"
  | "Segundo Centro"
  | "Wing"
  | "Fullback";

export type Grupo =
  | "Plantel Completo"
  | "Forwards"
  | "Backs"
  | "1ra Línea"
  | "2da Línea"
  | "3ra Línea"
  | "Medio Scrum"
  | "Apertura"
  | "1er Centro"
  | "2do Centro"
  | "Wing"
  | "Fullback";

export type TipoItem = "ejercicio" | "test";

// ─── Clases de ejercicios ─────────────────────────────────────────────────────

export type Clase =
  | "Fuerza"
  | "Potencia"
  | "Velocidad"
  | "Agilidad"
  | "Resistencia"
  | "Movilidad"
  | "Tren Superior"
  | "Tren Inferior"
  | "Core"
  | "Full Body"
  | "Prevención"
  | "Destrezas"
  | "Contacto";

export interface ClaseGrupo {
  grupo: string;
  clases: Clase[];
}

export const CLASES_DISPONIBLES: ClaseGrupo[] = [
  {
    grupo: "Capacidades",
    clases: ["Fuerza", "Potencia", "Velocidad", "Agilidad", "Resistencia", "Movilidad"],
  },
  {
    grupo: "Zonas",
    clases: ["Tren Superior", "Tren Inferior", "Core", "Full Body"],
  },
  {
    grupo: "Rugby",
    clases: ["Prevención", "Destrezas", "Contacto"],
  },
];

export function getGrupoDeLaClase(clase: Clase): string {
  return CLASES_DISPONIBLES.find((cg) => cg.clases.includes(clase))?.grupo ?? "";
}

// ─── Jerarquía: grupos a los que pertenece cada posición final ────────────────
// Importante: incluye la cadena completa hacia arriba en el árbol

export const GRUPOS_POR_POSICION: Record<PosicionFinal, Grupo[]> = {
  "Pilar Izquierdo": ["1ra Línea", "Forwards", "Plantel Completo"],
  Hooker: ["1ra Línea", "Forwards", "Plantel Completo"],
  "Pilar Derecho": ["1ra Línea", "Forwards", "Plantel Completo"],
  "Segunda Línea": ["2da Línea", "Forwards", "Plantel Completo"],
  Ala: ["3ra Línea", "Forwards", "Plantel Completo"],
  Octavo: ["3ra Línea", "Forwards", "Plantel Completo"],
  "Medio Scrum": ["Medio Scrum", "Backs", "Plantel Completo"],
  Apertura: ["Apertura", "Backs", "Plantel Completo"],
  "Primer Centro": ["1er Centro", "Backs", "Plantel Completo"],
  "Segundo Centro": ["2do Centro", "Backs", "Plantel Completo"],
  Wing: ["Wing", "Backs", "Plantel Completo"],
  Fullback: ["Fullback", "Backs", "Plantel Completo"],
};

// ─── Helper: todos los grupos a los que pertenece un jugador ─────────────────

export function getGruposDeJugador(posiciones: PosicionFinal[]): Grupo[] {
  const set = new Set<Grupo>();
  posiciones.forEach((pos) => {
    GRUPOS_POR_POSICION[pos]?.forEach((g) => set.add(g));
  });
  return Array.from(set);
}

// ─── Jugadores mock ──────────────────────────────────────────────────────────

export interface Jugador {
  id: string;
  nombre: string;
  numero: number;
  posiciones: PosicionFinal[];
  rol: Rol;
  iniciales: string;
}

export const JUGADORES: Jugador[] = [
  {
    id: "p1",
    nombre: "Marcos Ledesma",
    numero: 1,
    posiciones: ["Pilar Izquierdo"],
    rol: "jugador",
    iniciales: "ML",
  },
  {
    id: "p2",
    nombre: "Tomás Ortiz",
    numero: 5,
    posiciones: ["Segunda Línea"],
    rol: "jugador",
    iniciales: "TO",
  },
  {
    id: "p3",
    nombre: "Lucía Vega",
    numero: 12,
    posiciones: ["Primer Centro", "Wing"],
    rol: "jugador",
    iniciales: "LV",
  },
  {
    id: "p4",
    nombre: "Julián Ríos",
    numero: 2,
    posiciones: ["Hooker"],
    rol: "jugador",
    iniciales: "JR",
  },
  {
    id: "p5",
    nombre: "Santiago Paz",
    numero: 7,
    posiciones: ["Ala"],
    rol: "jugador",
    iniciales: "SP",
  },
];

// ─── Usuarios staff mock ──────────────────────────────────────────────────────

export interface StaffUser {
  id: string;
  nombre: string;
  rol: Rol;
  iniciales: string;
}

export const STAFF: StaffUser[] = [
  { id: "s1", nombre: "Diego Ferreyra", rol: "entrenador", iniciales: "DF" },
  { id: "s2", nombre: "Gabriela Mora", rol: "head_coach", iniciales: "GM" },
];

// ─── Plantillas de ejercicios y tests ────────────────────────────────────────

export const IMAGEN_FALLBACK =
  "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800";

export interface EjercicioTemplate {
  id: string;
  nombre: string;
  tipo: TipoItem;
  descripcion: string;
  unidad?: string;
  icono: string;
  clases: Clase[];
  imagenes: string[];
  esGlobal: boolean;
}

export const EJERCICIOS_TEMPLATE: EjercicioTemplate[] = [
  {
    id: "ej1",
    nombre: "Empuje Dinámico",
    tipo: "ejercicio",
    descripcion:
      "Priorizar la fase excéntrica lenta (3 seg). Mantener el core bloqueado en todo momento. 4 series de 8 repeticiones al 75% RM. Enfoque total en la explosividad vertical.",
    icono: "fitness_center",
    clases: ["Fuerza", "Potencia", "Tren Superior"],
    imagenes: [
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800",
    ],
    esGlobal: true,
  },
  {
    id: "ej2",
    nombre: "Sentadilla con Barra",
    tipo: "ejercicio",
    descripcion:
      "Posición de pies a la anchura de los hombros. Descenso controlado de 3 segundos. 5 series de 5 repeticiones al 85% RM.",
    icono: "fitness_center",
    clases: ["Fuerza", "Tren Inferior"],
    imagenes: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800",
    ],
    esGlobal: true,
  },
  {
    id: "ej3",
    nombre: "Sprint de 40m",
    tipo: "ejercicio",
    descripcion:
      "Salida desde posición de arranque. 8 repeticiones con 90 segundos de recuperación entre cada una. Cronometrar cada rep.",
    icono: "directions_run",
    clases: ["Velocidad", "Potencia", "Full Body"],
    imagenes: [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    ],
    esGlobal: true,
  },
  {
    id: "ej4",
    nombre: "Pase con Banda",
    tipo: "ejercicio",
    descripcion:
      "Pase con resistencia de banda elástica. 3 series de 15 repeticiones por lado. Foco en la mecánica de pase.",
    icono: "sports_rugby",
    clases: ["Destrezas", "Tren Superior"],
    imagenes: [
      "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800",
      "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800",
    ],
    esGlobal: true,
  },
  {
    id: "ej5",
    nombre: "Fuerza en Banco Plano",
    tipo: "ejercicio",
    descripcion:
      "Press de banca con barra. Agarre ligeramente más ancho que los hombros. Descenso controlado tocando el pecho. 4 series de 6 repeticiones al 80% RM.",
    icono: "fitness_center",
    clases: ["Fuerza", "Potencia", "Tren Superior"],
    imagenes: [
      "https://images.unsplash.com/photo-1567598508481-65985588e295?w=800",
    ],
    esGlobal: true,
  },
  {
    id: "ej6",
    nombre: "Prevención de Cuello",
    tipo: "ejercicio",
    descripcion:
      "Rutina de fortalecimiento cervical con banda elástica: flexión, extensión y laterales. 3 series de 20 repeticiones lentas en cada dirección. Fundamental para forwards.",
    icono: "fitness_center",
    clases: ["Prevención", "Tren Superior"],
    imagenes: [],
    esGlobal: true,
  },
  {
    id: "test1",
    nombre: "Test de Cooper",
    tipo: "test",
    descripcion:
      "Correr la mayor distancia posible en 12 minutos. Registrar metros recorridos al finalizar.",
    unidad: "metros",
    icono: "analytics",
    clases: ["Resistencia", "Full Body"],
    imagenes: [
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800",
    ],
    esGlobal: true,
  },
  {
    id: "test2",
    nombre: "Test 1RM Sentadilla",
    tipo: "test",
    descripcion:
      "Determinar el peso máximo en una sola repetición de sentadilla con barra. Calentar progresivamente antes.",
    unidad: "kg",
    icono: "analytics",
    clases: ["Fuerza", "Tren Inferior"],
    imagenes: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
    ],
    esGlobal: true,
  },
  {
    id: "test3",
    nombre: "Test Velocidad 40m",
    tipo: "test",
    descripcion:
      "Tiempo en cubrir 40 metros desde posición estática. Realizar 3 intentos y registrar el mejor.",
    unidad: "seg",
    icono: "analytics",
    clases: ["Velocidad", "Full Body"],
    imagenes: [
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    ],
    esGlobal: true,
  },
];

// ─── Agenda semanal simulada ──────────────────────────────────────────────────
// Semana actual: 19–25 Mayo 2026 (hoy = 20 Mayo)
// targets: grupos a los que se asigna el ejercicio

export interface AgendaItem {
  id: string;
  ejercicioId: string;
  fecha: string; // YYYY-MM-DD
  targets: Grupo[];
  comentarioEntrenador?: string;
}

export const AGENDA: AgendaItem[] = [
  // ── Lunes 19 ────────────────────────────────────────────────────────────
  {
    id: "a1",
    ejercicioId: "ej1",
    fecha: "2026-05-19",
    targets: ["Forwards", "Plantel Completo"],
    comentarioEntrenador: "4 series × 8 reps al 75% RM. Fase excéntrica lenta: 3 seg. Descansen 90 seg entre series.",
  },
  {
    id: "a2",
    ejercicioId: "ej4",
    fecha: "2026-05-19",
    targets: ["Backs"],
    comentarioEntrenador: "Foco en la mecánica de pase bajo presión. 3 series × 15 reps por lado.",
  },

  // ── Martes 20 (HOY) ─────────────────────────────────────────────────────
  // a3 + a4: mismo ejercicio (ej2) en el mismo día, targets solapados para
  // Marcos (Pilar → 1ra Línea ⊂ Forwards). Caso de prueba de DEDUPLICACIÓN.
  {
    id: "a3",
    ejercicioId: "ej2",
    fecha: "2026-05-20",
    targets: ["Forwards"],
    comentarioEntrenador: "5 series × 5 reps al 85% RM. Forwards: priorizá profundidad de sentadilla.",
  },
  {
    id: "a4",
    ejercicioId: "ej2",
    fecha: "2026-05-20",
    targets: ["1ra Línea"],
    comentarioEntrenador: "5 series × 5 reps al 85% RM. Forwards: priorizá profundidad de sentadilla.",
  },
  {
    id: "a5",
    ejercicioId: "ej3",
    fecha: "2026-05-20",
    targets: ["Plantel Completo"],
    comentarioEntrenador: "8 repeticiones, 90 seg de recuperación entre cada sprint. Registren su mejor tiempo.",
  },
  {
    id: "a6",
    ejercicioId: "test1",
    fecha: "2026-05-20",
    targets: ["Plantel Completo"],
  },
  // a7: mismo ejercicio (ej4) asignado a Backs y 1er Centro.
  // Lucía (Primer Centro + Wing → Backs + 1er Centro) debe ver UNA sola tarjeta.
  {
    id: "a7",
    ejercicioId: "ej4",
    fecha: "2026-05-20",
    targets: ["Backs"],
    comentarioEntrenador: "Backs: énfasis en velocidad de liberación. Mínimo 20 pases limpios por serie.",
  },
  {
    id: "a7b",
    ejercicioId: "ej4",
    fecha: "2026-05-20",
    targets: ["1er Centro"],
    comentarioEntrenador: "Backs: énfasis en velocidad de liberación. Mínimo 20 pases limpios por serie.",
  },

  // ── Miércoles 21 ────────────────────────────────────────────────────────
  {
    id: "a8",
    ejercicioId: "ej1",
    fecha: "2026-05-21",
    targets: ["Forwards"],
    comentarioEntrenador: "Carga reducida post-martes. 3 series × 10 reps al 65% RM. Foco en técnica.",
  },
  {
    id: "a9",
    ejercicioId: "ej3",
    fecha: "2026-05-21",
    targets: ["Backs"],
    comentarioEntrenador: "Backs: velocidad máxima. 6 repeticiones con 2 min de recuperación.",
  },
  {
    id: "a10",
    ejercicioId: "test2",
    fecha: "2026-05-21",
    targets: ["Forwards"],
  },

  // ── Jueves 22 ───────────────────────────────────────────────────────────
  {
    id: "a11",
    ejercicioId: "ej2",
    fecha: "2026-05-22",
    targets: ["Plantel Completo"],
    comentarioEntrenador: "Día de volumen: 4 series × 8 reps al 70% RM. Todos los grupos.",
  },

  // ── Viernes 23 ──────────────────────────────────────────────────────────
  {
    id: "a12",
    ejercicioId: "ej3",
    fecha: "2026-05-23",
    targets: ["Plantel Completo"],
    comentarioEntrenador: "Últimas repeticiones de la semana. Objetivo: mantener tiempo del martes o mejor.",
  },
  // a13 + a13b: duplicado para Wing/Backs — Lucía solo ve 1 tarjeta
  {
    id: "a13",
    ejercicioId: "test3",
    fecha: "2026-05-23",
    targets: ["Backs"],
  },
  {
    id: "a13b",
    ejercicioId: "test3",
    fecha: "2026-05-23",
    targets: ["Wing"],
  },
];

// ─── Historial de métricas (para gráficos de seguimiento) ────────────────────

export interface MetricaHistorica {
  testId: string;
  semanas: string[];
  promedioEquipo: number[];
  porJugador: Record<string, number[]>;
}

export const METRICAS_HISTORICAS: MetricaHistorica[] = [
  {
    testId: "test1",
    semanas: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Actual"],
    promedioEquipo: [2800, 2850, 2900, 2920, 2950, 2980],
    porJugador: {
      p1: [2600, 2700, 2750, 2800, 2850, 2900],
      p2: [2900, 2950, 3000, 3050, 3100, 3150],
      p3: [3100, 3150, 3200, 3180, 3220, 3280],
      p4: [2700, 2720, 2780, 2830, 2870, 2920],
      p5: [2950, 3000, 3050, 3100, 3150, 3200],
    },
  },
  {
    testId: "test2",
    semanas: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Actual"],
    promedioEquipo: [140, 145, 148, 152, 155, 158],
    porJugador: {
      p1: [180, 185, 190, 195, 205, 215],
      p2: [160, 165, 168, 170, 175, 180],
      p3: [95, 100, 105, 108, 112, 118],
      p4: [165, 168, 172, 175, 180, 185],
      p5: [150, 155, 158, 162, 165, 170],
    },
  },
  {
    testId: "test3",
    semanas: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Actual"],
    promedioEquipo: [5.8, 5.7, 5.6, 5.5, 5.4, 5.3],
    porJugador: {
      p1: [6.1, 6.0, 5.9, 5.8, 5.7, 5.6],
      p2: [5.9, 5.8, 5.7, 5.6, 5.5, 5.4],
      p3: [5.2, 5.1, 5.0, 4.9, 4.8, 4.7],
      p4: [6.0, 5.9, 5.8, 5.7, 5.6, 5.5],
      p5: [5.5, 5.4, 5.3, 5.2, 5.1, 5.0],
    },
  },
];

// ─── Estado de cumplimiento semanal (para grilla del entrenador) ──────────────
// true = completó todos los items del día, false = no completó, null = no tenía items

export type EstadoCumplimiento = true | false | null;

export const CUMPLIMIENTO_SEMANAL: Record<
  string,
  Record<string, EstadoCumplimiento>
> = {
  p1: {
    "2026-05-19": true,
    "2026-05-20": false,
    "2026-05-21": null,
    "2026-05-22": null,
    "2026-05-23": null,
  },
  p2: {
    "2026-05-19": true,
    "2026-05-20": false,
    "2026-05-21": null,
    "2026-05-22": null,
    "2026-05-23": null,
  },
  p3: {
    "2026-05-19": null,
    "2026-05-20": false,
    "2026-05-21": null,
    "2026-05-22": null,
    "2026-05-23": null,
  },
  p4: {
    "2026-05-19": true,
    "2026-05-20": false,
    "2026-05-21": null,
    "2026-05-22": null,
    "2026-05-23": null,
  },
  p5: {
    "2026-05-19": true,
    "2026-05-20": false,
    "2026-05-21": null,
    "2026-05-22": null,
    "2026-05-23": null,
  },
};

// ─── Semana de test (días visibles en la agenda) ──────────────────────────────

export const DIAS_SEMANA = [
  { fecha: "2026-05-19", label: "LUN", numero: 19 },
  { fecha: "2026-05-20", label: "MAR", numero: 20 },
  { fecha: "2026-05-21", label: "MIE", numero: 21 },
  { fecha: "2026-05-22", label: "JUE", numero: 22 },
  { fecha: "2026-05-23", label: "VIE", numero: 23 },
  { fecha: "2026-05-24", label: "SAB", numero: 24 },
  { fecha: "2026-05-25", label: "DOM", numero: 25 },
];

export const FECHA_HOY = "2026-05-20";
