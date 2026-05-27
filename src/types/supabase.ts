// ============================================================
//  Tipos de la base de datos Supabase — Rugby Pretemporada
//  Generado manualmente a partir del esquema SQL en:
//    supabase/migrations/20260522000000_init_rugby_schema.sql
//    supabase/migrations/20260522000001_rls_and_trigger.sql
//
//  Uso:
//    import { createClient } from '@supabase/supabase-js'
//    import type { Database } from '@/types/supabase'
//    const supabase = createClient<Database>(url, key)
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Tipo raíz ───────────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {

      // ── equipos ─────────────────────────────────────────────────────────────
      equipos: {
        Row: {
          id: string;
          nombre: string;
          codigo_ingreso: string;
          creado_en: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          codigo_ingreso: string;
          creado_en?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          codigo_ingreso?: string;
          creado_en?: string;
        };
        Relationships: [];
      };

      // ── perfiles ─────────────────────────────────────────────────────────────
      // Extiende auth.users (mismo UUID). Se crea via trigger en auth.on_signup.
      perfiles: {
        Row: {
          id: string;
          nombre_completo: string;
          rol: Database["public"]["Enums"]["rol_usuario"];
          estado_ingreso: Database["public"]["Enums"]["estado_ingreso"];
          equipo_id: string | null;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: {
          id: string;                              // debe coincidir con auth.uid()
          nombre_completo: string;
          rol?: Database["public"]["Enums"]["rol_usuario"];         // default: 'jugador'
          estado_ingreso?: Database["public"]["Enums"]["estado_ingreso"]; // default: 'pendiente'
          equipo_id?: string | null;
          creado_en?: string;
          actualizado_en?: string;
        };
        Update: {
          id?: string;
          nombre_completo?: string;
          rol?: Database["public"]["Enums"]["rol_usuario"];
          estado_ingreso?: Database["public"]["Enums"]["estado_ingreso"];
          equipo_id?: string | null;
          creado_en?: string;
          actualizado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: "perfiles_equipo_id_fkey";
            columns: ["equipo_id"];
            referencedRelation: "equipos";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── jugador_posiciones ───────────────────────────────────────────────────
      // Relación N:N entre perfiles y posición final en el campo.
      // Clave compuesta (jugador_id, posicion) — sin columna `id`.
      jugador_posiciones: {
        Row: {
          jugador_id: string;
          posicion: Database["public"]["Enums"]["posicion_final"];
        };
        Insert: {
          jugador_id: string;
          posicion: Database["public"]["Enums"]["posicion_final"];
        };
        Update: {
          jugador_id?: string;
          posicion?: Database["public"]["Enums"]["posicion_final"];
        };
        Relationships: [
          {
            foreignKeyName: "jugador_posiciones_jugador_id_fkey";
            columns: ["jugador_id"];
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── catalogo ─────────────────────────────────────────────────────────────
      // Plantillas de ejercicios y tests.
      // CHECK constraint: es_global=true ↔ equipo_id=null (PRD §7.4).
      catalogo: {
        Row: {
          id: string;
          titulo: string;
          tipo: Database["public"]["Enums"]["tipo_contenido"];
          descripcion: string | null;
          es_global: boolean;
          equipo_id: string | null;
          imagenes: string[];
          clases: string[];
          unidad_medicion: string | null;
          creado_por: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          titulo: string;
          tipo: Database["public"]["Enums"]["tipo_contenido"];
          descripcion?: string | null;
          es_global?: boolean;                     // default: false
          equipo_id?: string | null;
          imagenes?: string[];                     // default: '{}'
          clases?: string[];                       // default: '{}'
          unidad_medicion?: string | null;
          creado_por?: string | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          titulo?: string;
          tipo?: Database["public"]["Enums"]["tipo_contenido"];
          descripcion?: string | null;
          es_global?: boolean;
          equipo_id?: string | null;
          imagenes?: string[];
          clases?: string[];
          unidad_medicion?: string | null;
          creado_por?: string | null;
          creado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: "catalogo_equipo_id_fkey";
            columns: ["equipo_id"];
            referencedRelation: "equipos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "catalogo_creado_por_fkey";
            columns: ["creado_por"];
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── agenda ───────────────────────────────────────────────────────────────
      // Instancias diarias: un ejercicio del catálogo asignado a
      // una fecha y jerarquía específica de jugadores.
      agenda: {
        Row: {
          id: string;
          catalogo_id: string;
          equipo_id: string;
          fecha: string;                           // date → 'YYYY-MM-DD'
          comentario_entrenador: string | null;
          asignado_a: Database["public"]["Enums"]["jerarquia_grupo"];
          creado_por: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          catalogo_id: string;
          equipo_id: string;
          fecha: string;
          comentario_entrenador?: string | null;
          asignado_a: Database["public"]["Enums"]["jerarquia_grupo"];
          creado_por?: string | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          catalogo_id?: string;
          equipo_id?: string;
          fecha?: string;
          comentario_entrenador?: string | null;
          asignado_a?: Database["public"]["Enums"]["jerarquia_grupo"];
          creado_por?: string | null;
          creado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agenda_catalogo_id_fkey";
            columns: ["catalogo_id"];
            referencedRelation: "catalogo";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agenda_equipo_id_fkey";
            columns: ["equipo_id"];
            referencedRelation: "equipos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agenda_creado_por_fkey";
            columns: ["creado_por"];
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── resultados_tests ─────────────────────────────────────────────────────
      // Seguimiento individual por jugador: marcación de ejercicios
      // y carga de resultados de tests.
      // UNIQUE (agenda_id, jugador_id): un registro por jugador por ítem.
      resultados_tests: {
        Row: {
          id: string;
          agenda_id: string;
          jugador_id: string;
          realizado: boolean;
          resultado_numerico: number | null;       // numeric(10,2)
          resultado_tiempo: string | null;         // text libre: '12:34.5', etc.
          fecha_registro: string;
        };
        Insert: {
          id?: string;
          agenda_id: string;
          jugador_id: string;
          realizado?: boolean;                     // default: false
          resultado_numerico?: number | null;
          resultado_tiempo?: string | null;
          fecha_registro?: string;
        };
        Update: {
          id?: string;
          agenda_id?: string;
          jugador_id?: string;
          realizado?: boolean;
          resultado_numerico?: number | null;
          resultado_tiempo?: string | null;
          fecha_registro?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resultados_tests_agenda_id_fkey";
            columns: ["agenda_id"];
            referencedRelation: "agenda";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resultados_tests_jugador_id_fkey";
            columns: ["jugador_id"];
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    // ── Views ──────────────────────────────────────────────────────────────────
    Views: {
      [_ in never]: never;
    };

    // ── Functions ─────────────────────────────────────────────────────────────
    // Funciones SECURITY DEFINER creadas en la migración de RLS.
    Functions: {
      mi_equipo_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      mi_rol: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["rol_usuario"] | null;
      };
    };

    // ── Enums ─────────────────────────────────────────────────────────────────
    Enums: {
      // Roles del sistema (PRD §2 — Matriz de Roles y Permisos)
      rol_usuario: "admin" | "head_coach" | "entrenador" | "jugador";

      // Estado del flujo de aprobación de ingreso al equipo
      estado_ingreso: "pendiente" | "aprobado" | "rechazado";

      // Tipo de contenido del catálogo (determina la UI de la tarjeta)
      tipo_contenido: "ejercicio" | "test";

      // Posiciones finales en el campo — permite polifuncionalidad
      // vía la tabla jugador_posiciones (PRD §3)
      posicion_final:
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

      // Jerarquías usadas para asignar ejercicios en la agenda
      // Un jugador puede pertenecer a múltiples jerarquías simultáneamente
      jerarquia_grupo:
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
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ─── Helpers de conveniencia ─────────────────────────────────────────────────
// Permiten referenciar tipos de filas sin repetir el path completo.
//
// Uso:
//   type Perfil = Tables<'perfiles'>
//   type NuevoItem = TablesInsert<'catalogo'>
//   type RolUsuario = Enums<'rol_usuario'>

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];

// ─── Tipos derivados de uso frecuente ────────────────────────────────────────
// Evitan importar Database + usar el path largo en el código de la app.

export type Perfil             = Tables<"perfiles">;
export type Equipo             = Tables<"equipos">;
export type ItemCatalogo       = Tables<"catalogo">;
export type ItemAgenda         = Tables<"agenda">;
export type ResultadoTest      = Tables<"resultados_tests">;
export type JugadorPosicion    = Tables<"jugador_posiciones">;

export type RolUsuario         = Enums<"rol_usuario">;
export type EstadoIngreso      = Enums<"estado_ingreso">;
export type TipoContenido      = Enums<"tipo_contenido">;
export type PosicionFinal      = Enums<"posicion_final">;
export type JerarquiaGrupo     = Enums<"jerarquia_grupo">;

// ─── Tipos compuestos para las vistas de la app ───────────────────────────────
// Joins frecuentes pre-tipados para evitar any en los componentes.

// Ítem de catálogo con datos del creador resueltos
export type ItemCatalogoConAutor = ItemCatalogo & {
  creado_por_perfil: Pick<Perfil, "id" | "nombre_completo"> | null;
};

// Ítem de agenda con la plantilla del catálogo resuelta (join más frecuente)
export type ItemAgendaConCatalogo = ItemAgenda & {
  catalogo: ItemCatalogo;
};

// Resultado de test con el perfil del jugador resuelto (para rankings)
export type ResultadoConJugador = ResultadoTest & {
  jugador: Pick<Perfil, "id" | "nombre_completo">;
};

// Perfil del jugador con sus posiciones resueltas (para la vista del HC)
export type PerfilConPosiciones = Perfil & {
  posiciones: PosicionFinal[];
};
