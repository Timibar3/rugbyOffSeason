-- ============================================================
--  Rugby Pretemporada — Seguridad: RLS + Trigger de registro
--  Migración: 20260522000001_rls_and_trigger
--
--  ARQUITECTURA DE SEGURIDAD:
--  Todas las políticas de esta migración se apoyan en dos
--  funciones helper (mi_equipo_id / mi_rol) declaradas como
--  SECURITY DEFINER.  Esto resuelve el problema de dependencia
--  circular: si perfiles tuviera RLS activo y las políticas
--  necesitaran leer perfiles para validar, entrarían en un
--  loop infinito.  SECURITY DEFINER ejecuta la función como
--  el propietario (postgres) saltando RLS en esa lectura puntual.
--
--  SET search_path = public en cada función SECURITY DEFINER
--  es obligatorio para prevenir ataques de "search_path hijacking".
-- ============================================================


-- ============================================================
--  1. FUNCIONES HELPER DE CONTEXTO (SECURITY DEFINER)
--     Estas funciones son la columna vertebral de todas las
--     políticas RLS del proyecto.  Se marcan STABLE para que
--     PostgreSQL pueda cachear su resultado dentro de cada
--     ejecución de query, evitando N lecturas a perfiles.
-- ============================================================

-- Devuelve el equipo_id del usuario autenticado actualmente.
-- Retorna NULL si el usuario no tiene equipo asignado todavía.
CREATE OR REPLACE FUNCTION mi_equipo_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT equipo_id
  FROM   perfiles
  WHERE  id = auth.uid()
$$;

-- Devuelve el rol del usuario autenticado actualmente.
-- Retorna NULL si el usuario no tiene perfil (ventana de registro).
CREATE OR REPLACE FUNCTION mi_rol()
RETURNS rol_usuario
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT rol
  FROM   perfiles
  WHERE  id = auth.uid()
$$;


-- ============================================================
--  2. TRIGGER DE AUTOMATIZACIÓN DE REGISTRO
--     Crea una fila en `perfiles` por cada nuevo usuario que
--     se registre en Supabase Auth.
--
--     El frontend debe pasar el nombre en la metadata:
--       supabase.auth.signUp({
--         email, password,
--         options: { data: { nombre_completo: 'Juan Pérez' } }
--       })
--
--     SECURITY DEFINER permite insertar en `perfiles` incluso
--     cuando RLS está activo (la función corre como postgres).
-- ============================================================

CREATE OR REPLACE FUNCTION fn_crear_perfil_nuevo_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO perfiles (id, nombre_completo, rol, estado_ingreso)
  VALUES (
    NEW.id,
    -- Prioriza el nombre enviado en la metadata del signup.
    -- Si no viene, usa la parte local del email como fallback.
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'nombre_completo'), ''),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    'jugador',
    'pendiente'
  );
  RETURN NEW;
END;
$$;

-- El trigger se dispara DESPUÉS del INSERT en auth.users
-- para garantizar que NEW.id ya existe antes de hacer la FK.
CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION fn_crear_perfil_nuevo_usuario();


-- ============================================================
--  3. ACTIVACIÓN DE ROW LEVEL SECURITY
--     Sin esto las políticas existen pero no se aplican.
--     Se activa una vez; es idempotente relanzar la migración.
-- ============================================================

ALTER TABLE equipos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE jugador_posiciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo          ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda            ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_tests  ENABLE ROW LEVEL SECURITY;


-- ============================================================
--  4. POLÍTICAS RLS POR TABLA
--
--  Convención de nombres: "{tabla}_{operacion}_{alcance}"
--  Modelo: PERMISSIVE (default de Supabase).
--  Múltiples políticas para la misma operación se evalúan
--  con OR: una fila es visible si CUALQUIER política la permite.
-- ============================================================


-- ------------------------------------------------------------
--  4.1  EQUIPOS
--
--  SELECT abierto a todos los autenticados: el jugador necesita
--  poder buscar un equipo por codigo_ingreso durante el onboarding
--  sin tener perfil completo todavía.
--
--  INSERT abierto a todos los autenticados: la restricción real
--  de "solo head_coach crea equipos" se aplica en la lógica de
--  negocio del backend (Server Action). Agregar aquí la restricción
--  de rol crearía un huevo-gallina: el HC no tiene rol hasta que
--  crea el equipo.
--
--  UPDATE y DELETE: solo el HC del propio equipo o un admin.
-- ------------------------------------------------------------

CREATE POLICY "equipos_select"
  ON equipos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "equipos_insert"
  ON equipos FOR INSERT
  TO authenticated
  WITH CHECK (true);
  -- Nota: restringir a mi_rol() = 'head_coach' cuando el flujo
  -- de onboarding garantice que el rol se asigna antes del INSERT.

CREATE POLICY "equipos_update"
  ON equipos FOR UPDATE
  TO authenticated
  USING (
    id = mi_equipo_id()
    AND mi_rol() IN ('head_coach', 'admin')
  );

CREATE POLICY "equipos_delete"
  ON equipos FOR DELETE
  TO authenticated
  USING (mi_rol() = 'admin');


-- ------------------------------------------------------------
--  4.2  PERFILES
--
--  SELECT — dos políticas con OR implícito:
--    a) Propio perfil: siempre.
--    b) Perfiles del mismo equipo: solo para staff (HC/entrenador/admin).
--       Los jugadores NO pueden ver los perfiles de sus compañeros.
--
--  INSERT — bloqueado para todos los usuarios normales.
--    La única vía de creación es el trigger SECURITY DEFINER.
--    No hay política INSERT → acceso denegado por defecto.
--
--  UPDATE — dos políticas con OR implícito:
--    a) Propio perfil (nombre, etc.).
--    b) HC y admin pueden modificar perfiles de su equipo
--       (cambiar estado_ingreso a 'aprobado', asignar equipo_id).
-- ------------------------------------------------------------

CREATE POLICY "perfiles_select_propio"
  ON perfiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "perfiles_select_equipo"
  ON perfiles FOR SELECT
  TO authenticated
  USING (
    equipo_id = mi_equipo_id()
    AND mi_rol() IN ('head_coach', 'entrenador', 'admin')
  );

CREATE POLICY "perfiles_update_propio"
  ON perfiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "perfiles_update_staff"
  ON perfiles FOR UPDATE
  TO authenticated
  USING (
    equipo_id = mi_equipo_id()
    AND mi_rol() IN ('head_coach', 'admin')
  );


-- ------------------------------------------------------------
--  4.3  JUGADOR_POSICIONES
--
--  SELECT: cada jugador ve sus propias posiciones; el staff
--  ve las posiciones de todos los integrantes de su equipo
--  (necesario para resolver qué ejercicios debe ver cada jugador).
--
--  INSERT / DELETE: solo HC y admin pueden gestionar posiciones
--  (se asignan en el flujo de aprobación, no por el jugador).
-- ------------------------------------------------------------

CREATE POLICY "jugador_posiciones_select_propio"
  ON jugador_posiciones FOR SELECT
  TO authenticated
  USING (jugador_id = auth.uid());

CREATE POLICY "jugador_posiciones_select_staff"
  ON jugador_posiciones FOR SELECT
  TO authenticated
  USING (
    mi_rol() IN ('head_coach', 'entrenador', 'admin')
    AND EXISTS (
      SELECT 1
      FROM   perfiles p
      WHERE  p.id        = jugador_posiciones.jugador_id
      AND    p.equipo_id = mi_equipo_id()
    )
  );

CREATE POLICY "jugador_posiciones_insert"
  ON jugador_posiciones FOR INSERT
  TO authenticated
  WITH CHECK (
    mi_rol() IN ('head_coach', 'admin')
    AND EXISTS (
      SELECT 1
      FROM   perfiles p
      WHERE  p.id        = jugador_id
      AND    p.equipo_id = mi_equipo_id()
    )
  );

CREATE POLICY "jugador_posiciones_delete"
  ON jugador_posiciones FOR DELETE
  TO authenticated
  USING (
    mi_rol() IN ('head_coach', 'admin')
    AND EXISTS (
      SELECT 1
      FROM   perfiles p
      WHERE  p.id        = jugador_posiciones.jugador_id
      AND    p.equipo_id = mi_equipo_id()
    )
  );


-- ------------------------------------------------------------
--  4.4  CATALOGO
--
--  SELECT: ejercicios globales (es_global=true) son visibles
--  para todo usuario autenticado. Ejercicios privados solo para
--  integrantes del equipo propietario.
--
--  INSERT:
--    · admin     → puede crear ítems globales (es_global=true, equipo_id=NULL).
--    · HC / ent  → pueden crear ítems privados (es_global=false, equipo_id=suyo).
--  El CHECK constraint de la tabla garantiza la coherencia
--  global/equipo a nivel de BD como segunda línea de defensa.
--
--  UPDATE / DELETE: misma separación admin ↔ staff.
--  El staff NUNCA puede tocar ítems globales (es_global=true).
-- ------------------------------------------------------------

CREATE POLICY "catalogo_select"
  ON catalogo FOR SELECT
  TO authenticated
  USING (
    es_global = true
    OR equipo_id = mi_equipo_id()
  );

CREATE POLICY "catalogo_insert"
  ON catalogo FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admin crea ítems base del sistema
    (mi_rol() = 'admin'
     AND es_global   = true
     AND equipo_id   IS NULL)
    OR
    -- Staff crea ítems privados del equipo
    (mi_rol() IN ('head_coach', 'entrenador')
     AND es_global   = false
     AND equipo_id   = mi_equipo_id())
  );

CREATE POLICY "catalogo_update"
  ON catalogo FOR UPDATE
  TO authenticated
  USING (
    (mi_rol() = 'admin'       AND es_global = true)
    OR
    (mi_rol() IN ('head_coach', 'entrenador')
     AND es_global = false
     AND equipo_id = mi_equipo_id())
  );

CREATE POLICY "catalogo_delete"
  ON catalogo FOR DELETE
  TO authenticated
  USING (
    (mi_rol() = 'admin'       AND es_global = true)
    OR
    (mi_rol() IN ('head_coach', 'entrenador')
     AND es_global = false
     AND equipo_id = mi_equipo_id())
  );


-- ------------------------------------------------------------
--  4.5  AGENDA
--
--  SELECT: cualquier integrante del equipo puede leer la agenda
--  (el jugador la necesita para su vista diaria).
--
--  INSERT / UPDATE / DELETE: exclusivo para HC y entrenador.
--  Los jugadores pueden ver pero no modificar la planificación.
-- ------------------------------------------------------------

CREATE POLICY "agenda_select"
  ON agenda FOR SELECT
  TO authenticated
  USING (equipo_id = mi_equipo_id());

CREATE POLICY "agenda_insert"
  ON agenda FOR INSERT
  TO authenticated
  WITH CHECK (
    equipo_id = mi_equipo_id()
    AND mi_rol() IN ('head_coach', 'entrenador')
  );

CREATE POLICY "agenda_update"
  ON agenda FOR UPDATE
  TO authenticated
  USING (
    equipo_id = mi_equipo_id()
    AND mi_rol() IN ('head_coach', 'entrenador')
  );

CREATE POLICY "agenda_delete"
  ON agenda FOR DELETE
  TO authenticated
  USING (
    equipo_id = mi_equipo_id()
    AND mi_rol() IN ('head_coach', 'entrenador')
  );


-- ------------------------------------------------------------
--  4.6  RESULTADOS_TESTS
--
--  resultados_tests no tiene equipo_id propio: para políticas
--  del staff se resuelve via JOIN a agenda (que sí lo tiene).
--  El EXISTS con subquery es la forma correcta de hacer esto
--  respetando RLS sobre agenda al mismo tiempo.
--
--  SELECT — dos políticas con OR implícito:
--    a) Jugador: solo sus propias filas (privacidad PRD §2).
--    b) Staff: todas las filas de ítems de agenda de su equipo
--       (necesario para rankings e informes globales).
--
--  INSERT / UPDATE: solo el propio jugador.
--    El staff ve los datos pero NO los carga en nombre del jugador.
--    (El jugador registra sus propios resultados desde la app.)
-- ------------------------------------------------------------

CREATE POLICY "resultados_select_propio"
  ON resultados_tests FOR SELECT
  TO authenticated
  USING (jugador_id = auth.uid());

CREATE POLICY "resultados_select_staff"
  ON resultados_tests FOR SELECT
  TO authenticated
  USING (
    mi_rol() IN ('head_coach', 'entrenador', 'admin')
    AND EXISTS (
      SELECT 1
      FROM   agenda a
      WHERE  a.id        = resultados_tests.agenda_id
      AND    a.equipo_id = mi_equipo_id()
    )
  );

CREATE POLICY "resultados_insert"
  ON resultados_tests FOR INSERT
  TO authenticated
  WITH CHECK (jugador_id = auth.uid());

CREATE POLICY "resultados_update"
  ON resultados_tests FOR UPDATE
  TO authenticated
  USING (jugador_id = auth.uid());
