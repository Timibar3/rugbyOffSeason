-- ============================================================
--  Rugby Pretemporada — Esquema inicial
--  Migración: 20260522000000_init_rugby_schema
--
--  NOTAS:
--  · Las políticas RLS se aplican en una migración separada.
--  · gen_random_uuid() está disponible en Supabase sin extensión extra.
--  · Los tipos ENUM reflejan exactamente el árbol jerárquico del PRD.
-- ============================================================


-- ============================================================
--  1. TIPOS ENUMERADOS
-- ============================================================

-- Roles del sistema
CREATE TYPE rol_usuario AS ENUM (
  'admin',
  'head_coach',
  'entrenador',
  'jugador'
);

-- Estado del flujo de ingreso al equipo
CREATE TYPE estado_ingreso AS ENUM (
  'pendiente',
  'aprobado',
  'rechazado'
);

-- Tipo de contenido del catálogo
CREATE TYPE tipo_contenido AS ENUM (
  'ejercicio',
  'test'
);

-- Posiciones finales (puestos concretos que un jugador ocupa en el campo)
-- Permite polifuncionalidad vía la tabla jugador_posiciones.
CREATE TYPE posicion_final AS ENUM (
  'Pilar Izquierdo',
  'Hooker',
  'Pilar Derecho',
  'Segunda Línea',
  'Ala',
  'Octavo',
  'Medio Scrum',
  'Apertura',
  'Primer Centro',
  'Segundo Centro',
  'Wing',
  'Fullback'
);

-- Jerarquías de grupo usadas para asignar ejercicios en la agenda.
-- Un ítem de agenda se asigna a UNA jerarquía; la resolución de qué
-- jugadores la ven se hace en la capa de aplicación (deduplicación PRD §3).
CREATE TYPE jerarquia_grupo AS ENUM (
  'Plantel Completo',
  'Forwards',
  'Backs',
  '1ra Línea',
  '2da Línea',
  '3ra Línea',
  'Medio Scrum',
  'Apertura',
  '1er Centro',
  '2do Centro',
  'Wing',
  'Fullback'
);


-- ============================================================
--  2. TABLAS
-- ============================================================

-- ------------------------------------------------------------
--  2.1  EQUIPOS
--       Un Head Coach crea el equipo y obtiene un código corto
--       único que comparte con los jugadores para que se unan.
-- ------------------------------------------------------------
CREATE TABLE equipos (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         text        NOT NULL,
  codigo_ingreso text        UNIQUE NOT NULL,
  creado_en      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  equipos               IS 'Clubes o equipos registrados en la plataforma.';
COMMENT ON COLUMN equipos.codigo_ingreso IS 'Código corto que el Head Coach comparte con sus jugadores para unirse.';


-- ------------------------------------------------------------
--  2.2  PERFILES
--       Extiende auth.users con datos de negocio.
--       Un trigger de Supabase puede crear este registro
--       automáticamente en el evento auth.on_signup.
-- ------------------------------------------------------------
CREATE TABLE perfiles (
  id              uuid           PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo text           NOT NULL,
  rol             rol_usuario    NOT NULL DEFAULT 'jugador',
  estado_ingreso  estado_ingreso NOT NULL DEFAULT 'pendiente',
  equipo_id       uuid           REFERENCES equipos(id) ON DELETE SET NULL,
  creado_en       timestamptz    NOT NULL DEFAULT now(),
  actualizado_en  timestamptz    NOT NULL DEFAULT now()
);

COMMENT ON TABLE  perfiles               IS 'Perfil de negocio vinculado a auth.users. Se crea al registrarse.';
COMMENT ON COLUMN perfiles.estado_ingreso IS 'pendiente hasta que el Head Coach apruebe la solicitud del jugador.';
COMMENT ON COLUMN perfiles.equipo_id      IS 'NULL si el usuario es admin global o aún no tiene equipo asignado.';

-- Mantiene actualizado_en sincronizado con cada UPDATE
CREATE OR REPLACE FUNCTION fn_set_actualizado_en()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_perfiles_actualizado_en
  BEFORE UPDATE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();


-- ------------------------------------------------------------
--  2.3  JUGADOR_POSICIONES
--       Relación N:N entre perfiles y posiciones del campo.
--       Permite la polifuncionalidad descrita en el PRD §3.
-- ------------------------------------------------------------
CREATE TABLE jugador_posiciones (
  jugador_id uuid           NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  posicion   posicion_final NOT NULL,
  PRIMARY KEY (jugador_id, posicion)
);

COMMENT ON TABLE jugador_posiciones IS 'Un jugador puede tener más de una posición final asignada (polifuncional).';


-- ------------------------------------------------------------
--  2.4  CATALOGO
--       Biblioteca de plantillas de ejercicios y tests.
--
--       Dos niveles de visibilidad (PRD §7.4):
--         · es_global = TRUE  → creado por admin, visible para todos,
--                               equipo_id DEBE ser NULL.
--         · es_global = FALSE → creado por el staff del equipo,
--                               visible solo para ese equipo,
--                               equipo_id NO puede ser NULL.
--
--       El CHECK garantiza esta coherencia a nivel de base de datos.
-- ------------------------------------------------------------
CREATE TABLE catalogo (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo          text           NOT NULL,
  tipo            tipo_contenido NOT NULL,
  descripcion     text,
  es_global       boolean        NOT NULL DEFAULT false,
  equipo_id       uuid           REFERENCES equipos(id) ON DELETE CASCADE,
  imagenes        text[]         NOT NULL DEFAULT '{}',
  clases          text[]         NOT NULL DEFAULT '{}',
  unidad_medicion text,
  creado_por      uuid           REFERENCES perfiles(id) ON DELETE SET NULL,
  creado_en       timestamptz    NOT NULL DEFAULT now(),

  CONSTRAINT chk_catalogo_coherencia_global CHECK (
    (es_global = true  AND equipo_id IS NULL   ) OR
    (es_global = false AND equipo_id IS NOT NULL)
  )
);

COMMENT ON TABLE  catalogo               IS 'Plantillas de ejercicios y tests. Separa el "qué es" del "cuándo y para quién".';
COMMENT ON COLUMN catalogo.es_global      IS 'TRUE → ejercicio base del administrador (no editable por el staff). FALSE → privado del equipo.';
COMMENT ON COLUMN catalogo.imagenes       IS 'Array de URLs (Supabase Storage u externas).';
COMMENT ON COLUMN catalogo.clases         IS 'Etiquetas multi-valor: Fuerza, Velocidad, Core, Destrezas, etc. (PRD §7.2).';
COMMENT ON COLUMN catalogo.unidad_medicion IS 'Solo para tipo=test. Ej: ''metros'', ''kg'', ''seg''.';


-- ------------------------------------------------------------
--  2.5  AGENDA
--       Instancias de ejercicios/tests asignadas por el staff
--       a una fecha y jerarquía de jugadores específicas.
--
--       Regla de negocio (PRD §3.1):
--         · El comentario_entrenador es mutable en la instancia
--           sin afectar la plantilla del catálogo.
--         · Al clonar un ítem, la nueva fila hereda el comentario.
--         · La deduplicación para polifuncionales se resuelve en
--           la capa de aplicación usando (catalogo_id, fecha).
-- ------------------------------------------------------------
CREATE TABLE agenda (
  id                    uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogo_id           uuid            NOT NULL REFERENCES catalogo(id) ON DELETE CASCADE,
  equipo_id             uuid            NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  fecha                 date            NOT NULL,
  comentario_entrenador text,
  asignado_a            jerarquia_grupo NOT NULL,
  creado_por            uuid            REFERENCES perfiles(id) ON DELETE SET NULL,
  creado_en             timestamptz     NOT NULL DEFAULT now()
);

COMMENT ON TABLE  agenda             IS 'Cada fila es una asignación de un ejercicio a un día y jerarquía. Una misma fecha puede tener múltiples filas para el mismo ejercicio si se asigna a jerarquías distintas.';
COMMENT ON COLUMN agenda.asignado_a  IS 'Jerarquía objetivo. La deduplicación se resuelve en la aplicación (PRD §3, regla crítica).';
COMMENT ON COLUMN agenda.comentario_entrenador IS 'Instrucciones de carga específicas del día (series, kg, repeticiones). Mutable sin tocar el catálogo.';


-- ------------------------------------------------------------
--  2.6  RESULTADOS_TESTS
--       Seguimiento individual por jugador de cada ítem de agenda.
--
--       · Para tipo = 'ejercicio': se registra solo `realizado`.
--       · Para tipo = 'test':      se registra el resultado
--         numérico o temporal además del booleano.
--
--       La restricción UNIQUE evita registros duplicados por
--       jugador y ítem de agenda.
-- ------------------------------------------------------------
CREATE TABLE resultados_tests (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id          uuid        NOT NULL REFERENCES agenda(id) ON DELETE CASCADE,
  jugador_id         uuid        NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  realizado          boolean     NOT NULL DEFAULT false,
  resultado_numerico numeric(10, 2),
  resultado_tiempo   text,
  fecha_registro     timestamptz NOT NULL DEFAULT now(),

  UNIQUE (agenda_id, jugador_id)
);

COMMENT ON TABLE  resultados_tests              IS 'Un registro por jugador por ítem de agenda. Unifica marcación de ejercicios y carga de resultados de tests.';
COMMENT ON COLUMN resultados_tests.realizado     IS 'TRUE cuando el jugador marca el ejercicio como realizado o cuando carga un resultado de test.';
COMMENT ON COLUMN resultados_tests.resultado_numerico IS 'Para tests cuantitativos: pesos (kg), distancia (m), repeticiones máximas.';
COMMENT ON COLUMN resultados_tests.resultado_tiempo   IS 'Para marcas temporales (ej: ''12:34.5''). Almacenado como text para flexibilidad; migrar a interval si se necesita aritmética.';


-- ============================================================
--  3. ÍNDICES
--  Optimizados para las consultas más frecuentes del PRD.
-- ============================================================

-- Agenda del día para un equipo (consulta principal del jugador y entrenador)
CREATE INDEX idx_agenda_equipo_fecha
  ON agenda (equipo_id, fecha);

-- Todos los ítems de un ejercicio del catálogo (dedup + borrado en cascada)
CREATE INDEX idx_agenda_catalogo_id
  ON agenda (catalogo_id);

-- Historial de resultados de un jugador (vista de evolución individual)
CREATE INDEX idx_resultados_jugador
  ON resultados_tests (jugador_id);

-- Todos los resultados de un ítem de agenda (ranking del entrenador)
CREATE INDEX idx_resultados_agenda
  ON resultados_tests (agenda_id);

-- Catálogo privado de un equipo
CREATE INDEX idx_catalogo_equipo
  ON catalogo (equipo_id)
  WHERE es_global = false;

-- Catálogo global (visible para todos los equipos)
CREATE INDEX idx_catalogo_global
  ON catalogo (tipo)
  WHERE es_global = true;

-- Posiciones de un jugador (resolución de jerarquías)
CREATE INDEX idx_jugador_posiciones_jugador
  ON jugador_posiciones (jugador_id);

-- Miembros de un equipo (panel del Head Coach)
CREATE INDEX idx_perfiles_equipo
  ON perfiles (equipo_id);

-- Solicitudes pendientes de ingreso (bandeja del Head Coach)
CREATE INDEX idx_perfiles_pendientes
  ON perfiles (equipo_id, estado_ingreso)
  WHERE estado_ingreso = 'pendiente';
