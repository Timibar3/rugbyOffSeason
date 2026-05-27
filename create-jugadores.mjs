import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan variables de entorno.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EQUIPO_CODE = "OFV0QW";
const PASSWORD    = "Rugby2026!";

const JUGADORES = [
  {
    email: "rodrigo.mendez@rugbytest.com",
    nombre: "Rodrigo Méndez",
    posiciones: ["Pilar Izquierdo", "Pilar Derecho"],
  },
  {
    email: "federico.torres@rugbytest.com",
    nombre: "Federico Torres",
    posiciones: ["Apertura", "Primer Centro"],
  },
  {
    email: "sofia.ramirez@rugbytest.com",
    nombre: "Sofía Ramírez",
    posiciones: ["Wing", "Fullback"],
  },
];

const { data: equipo, error: eqErr } = await supabase
  .from("equipos")
  .select("id")
  .eq("codigo_ingreso", EQUIPO_CODE)
  .single();

if (eqErr || !equipo) {
  console.error("Equipo no encontrado:", eqErr?.message);
  process.exit(1);
}

console.log(`Equipo encontrado: ${equipo.id}\n`);

for (const j of JUGADORES) {
  // 1. Crear usuario auth
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: j.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { nombre_completo: j.nombre },
  });

  if (authErr) {
    console.error(`✗ Error creando ${j.email}: ${authErr.message}`);
    continue;
  }

  const uid = authData.user.id;

  // 2. Actualizar perfil (el trigger lo creó en 'pendiente')
  const { error: perfErr } = await supabase
    .from("perfiles")
    .update({ equipo_id: equipo.id, estado_ingreso: "aprobado" })
    .eq("id", uid);

  if (perfErr) {
    console.error(`✗ Error actualizando perfil de ${j.nombre}: ${perfErr.message}`);
    continue;
  }

  // 3. Asignar posiciones
  const posRows = j.posiciones.map((pos) => ({ jugador_id: uid, posicion: pos }));
  const { error: posErr } = await supabase.from("jugador_posiciones").insert(posRows);

  if (posErr) {
    console.error(`✗ Error asignando posiciones de ${j.nombre}: ${posErr.message}`);
    continue;
  }

  console.log(`✓ ${j.nombre}`);
  console.log(`  Email:     ${j.email}`);
  console.log(`  Password:  ${PASSWORD}`);
  console.log(`  Posición:  ${j.posiciones.join(" / ")}`);
  console.log();
}
