"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Users, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function generarCodigo(): string {
  return Math.random().toString(36).toUpperCase().substring(2, 8);
}

type Vista = "tabs" | "esperando";

export default function UnirsePage() {
  const router = useRouter();
  const [vista, setVista] = useState<Vista | null>(null);
  const [tab, setTab] = useState<"unirse" | "crear">("unirse");

  const [codigoInput, setCodigoInput]   = useState("");
  const [errorUnirse, setErrorUnirse]   = useState<string | null>(null);
  const [loadingUnirse, setLoadingUnirse] = useState(false);

  const [nombreEquipo, setNombreEquipo] = useState("");
  const [errorCrear, setErrorCrear]     = useState<string | null>(null);
  const [loadingCrear, setLoadingCrear] = useState(false);

  const [equipoNombre, setEquipoNombre] = useState("");

  useEffect(() => {
    async function verificarEstado() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("rol, estado_ingreso, equipo_id")
        .eq("id", user.id)
        .single();

      if (!perfil) { router.push("/login"); return; }

      if (perfil.equipo_id && perfil.estado_ingreso === "aprobado") {
        if (perfil.rol === "jugador") router.push("/jugador/agenda");
        else router.push("/entrenador/agenda");
        return;
      }

      if (perfil.equipo_id && perfil.estado_ingreso === "pendiente") {
        const { data: equipo } = await supabase
          .from("equipos")
          .select("nombre")
          .eq("id", perfil.equipo_id)
          .single();
        setEquipoNombre(equipo?.nombre ?? "");
        setVista("esperando");
        return;
      }

      setVista("tabs");
    }

    verificarEstado();
  }, [router]);

  async function handleUnirse(e: React.FormEvent) {
    e.preventDefault();
    setErrorUnirse(null);
    setLoadingUnirse(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: equipo, error: equipoError } = await supabase
      .from("equipos")
      .select("id, nombre")
      .eq("codigo_ingreso", codigoInput.trim().toUpperCase())
      .single();

    if (equipoError || !equipo) {
      setErrorUnirse("Código inválido. Verificá que sea correcto.");
      setLoadingUnirse(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("perfiles")
      .update({ equipo_id: equipo.id })
      .eq("id", user.id);

    if (updateError) {
      setErrorUnirse("Error al unirse al equipo. Intentá de nuevo.");
      setLoadingUnirse(false);
      return;
    }

    setEquipoNombre(equipo.nombre);
    setVista("esperando");
    setLoadingUnirse(false);
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setErrorCrear(null);
    setLoadingCrear(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const codigo = generarCodigo();

    const { data: equipo, error: equipoError } = await supabase
      .from("equipos")
      .insert({ nombre: nombreEquipo.trim(), codigo_ingreso: codigo })
      .select("id")
      .single();

    if (equipoError || !equipo) {
      setErrorCrear("Error al crear el equipo. Intentá de nuevo.");
      setLoadingCrear(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("perfiles")
      .update({
        equipo_id: equipo.id,
        rol: "head_coach",
        estado_ingreso: "aprobado",
      })
      .eq("id", user.id);

    if (updateError) {
      setErrorCrear("Error al configurar tu perfil. Intentá de nuevo.");
      setLoadingCrear(false);
      return;
    }

    router.push("/entrenador/agenda");
  }

  async function handleVerificarEstado() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("estado_ingreso, rol")
      .eq("id", user.id)
      .single();

    if (perfil?.estado_ingreso === "aprobado") {
      if (perfil.rol === "jugador") router.push("/jugador/agenda");
      else router.push("/entrenador/agenda");
    }
  }

  // ── Cargando ───────────────────────────────────────────────────────────────
  if (vista === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-6 h-6 rounded-full border-2 border-primary-container border-t-transparent animate-spin" />
      </main>
    );
  }

  // ── Esperando aprobación ───────────────────────────────────────────────────
  if (vista === "esperando") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-surface px-5 py-12">
        <div className="w-full max-w-sm bg-surface-container border border-outline-variant rounded-xl p-8 text-center">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center">
              <Clock className="text-on-surface-variant" size={28} />
            </div>
          </div>

          <h2 className="font-inter font-bold text-xl text-on-surface mb-2">
            Solicitud enviada
          </h2>

          {equipoNombre && (
            <p className="font-jetbrains text-[10px] tracking-widest text-primary-container uppercase mb-4">
              {equipoNombre}
            </p>
          )}

          <p className="font-inter text-sm text-on-surface-variant leading-relaxed mb-6">
            Tu solicitud fue enviada al Head Coach. Una vez que apruebe tu ingreso podrás acceder al sistema.
          </p>

          <div className="p-4 bg-surface-container-high border border-outline-variant rounded-lg text-left space-y-2.5 mb-6">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={13} className="text-primary-container mt-0.5 flex-shrink-0" />
              <p className="font-inter text-xs text-on-surface-variant">
                Tu cuenta está creada y vinculada al equipo.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock size={13} className="text-on-surface-variant/40 mt-0.5 flex-shrink-0" />
              <p className="font-inter text-xs text-on-surface-variant">
                El Head Coach recibirá tu solicitud y te asignará las posiciones.
              </p>
            </div>
          </div>

          <button
            onClick={handleVerificarEstado}
            className="w-full py-3 bg-surface-container-high border border-outline-variant text-on-surface-variant font-jetbrains text-[10px] tracking-[0.15em] rounded-lg hover:border-primary-container hover:text-on-surface transition-all"
          >
            VERIFICAR ESTADO
          </button>
        </div>
      </main>
    );
  }

  // ── Tabs: Unirse / Crear ───────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-surface px-5 py-12">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-1.5 h-7 bg-primary-container rounded-sm" />
          <span className="font-jetbrains text-[10px] tracking-[0.2em] text-on-surface-variant uppercase">
            Sistema de Pretemporada
          </span>
        </div>
        <h1
          className="font-inter font-black text-4xl text-primary tracking-tighter leading-none"
          style={{ letterSpacing: "-0.02em" }}
        >
          RUGBY
          <br />
          <span className="text-primary-container">PERFORMANCE</span>
        </h1>
      </div>

      <div className="w-full max-w-sm bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        {/* Tab selector */}
        <div className="grid grid-cols-2 border-b border-outline-variant">
          <button
            onClick={() => setTab("unirse")}
            className={`flex items-center justify-center gap-2 py-4 font-jetbrains text-[10px] tracking-[0.12em] uppercase transition-all ${
              tab === "unirse"
                ? "text-primary-container border-b-2 border-primary-container bg-surface-container-high"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Users size={12} />
            Unirme
          </button>
          <button
            onClick={() => setTab("crear")}
            className={`flex items-center justify-center gap-2 py-4 font-jetbrains text-[10px] tracking-[0.12em] uppercase transition-all ${
              tab === "crear"
                ? "text-primary-container border-b-2 border-primary-container bg-surface-container-high"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Shield size={12} />
            Crear equipo
          </button>
        </div>

        <div className="p-7">
          {/* ── Tab Unirse ── */}
          {tab === "unirse" && (
            <>
              <h2 className="font-inter font-bold text-lg text-on-surface mb-1">
                Unirme a un equipo
              </h2>
              <p className="font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-7">
                Ingresá el código que te dio tu Head Coach
              </p>

              <form onSubmit={handleUnirse} className="space-y-4">
                <div>
                  <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
                    Código de equipo
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={codigoInput}
                    onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-jetbrains text-sm tracking-[0.2em] uppercase focus:border-primary-container focus:outline-none transition-colors placeholder:text-on-surface-variant/40"
                  />
                </div>

                {errorUnirse && (
                  <div className="p-3 bg-error/10 border border-error/30 rounded-lg">
                    <p className="font-inter text-xs text-error leading-relaxed">{errorUnirse}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingUnirse || codigoInput.length < 6}
                  className="w-full py-3.5 mt-2 bg-primary-container text-on-primary-fixed font-jetbrains text-[11px] tracking-[0.15em] font-black rounded-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingUnirse ? "PROCESANDO..." : "SOLICITAR INGRESO"}
                </button>
              </form>
            </>
          )}

          {/* ── Tab Crear ── */}
          {tab === "crear" && (
            <>
              <h2 className="font-inter font-bold text-lg text-on-surface mb-1">
                Crear mi equipo
              </h2>
              <p className="font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-7">
                Serás el Head Coach del equipo
              </p>

              <form onSubmit={handleCrear} className="space-y-4">
                <div>
                  <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
                    Nombre del equipo
                  </label>
                  <input
                    type="text"
                    required
                    value={nombreEquipo}
                    onChange={(e) => setNombreEquipo(e.target.value)}
                    placeholder="Los Pumas RC"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-inter text-sm focus:border-primary-container focus:outline-none transition-colors placeholder:text-on-surface-variant/40"
                  />
                </div>

                <div className="p-3 bg-surface-container-high border border-outline-variant rounded-lg">
                  <p className="font-jetbrains text-[9px] tracking-widest text-on-surface-variant uppercase mb-1">
                    Tu rol
                  </p>
                  <p className="font-inter text-xs text-on-surface">
                    Se te asignará el rol de{" "}
                    <span className="text-primary-container font-medium">Head Coach</span>{" "}
                    con acceso completo al panel de entrenamiento.
                  </p>
                </div>

                {errorCrear && (
                  <div className="p-3 bg-error/10 border border-error/30 rounded-lg">
                    <p className="font-inter text-xs text-error leading-relaxed">{errorCrear}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingCrear || !nombreEquipo.trim()}
                  className="w-full py-3.5 mt-2 bg-primary-container text-on-primary-fixed font-jetbrains text-[11px] tracking-[0.15em] font-black rounded-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingCrear ? "CREANDO..." : "CREAR EQUIPO"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
