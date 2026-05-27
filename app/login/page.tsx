"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function traducirError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Email o contraseña incorrectos.";
  if (msg.includes("Email not confirmed"))       return "Confirmá tu email antes de iniciar sesión.";
  if (msg.includes("Too many requests"))         return "Demasiados intentos. Esperá unos minutos.";
  return msg;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(traducirError(authError.message));
      setLoading(false);
      return;
    }

    // Leer el perfil para saber a dónde redirigir
    const { data: perfil, error: perfilError } = await supabase
      .from("perfiles")
      .select("rol, estado_ingreso, equipo_id")
      .eq("id", data.user.id)
      .single();

    if (perfilError || !perfil) {
      setError("No se encontró tu perfil. Contactá al administrador.");
      setLoading(false);
      return;
    }

    router.refresh();

    // Sin equipo o pendiente de aprobación → flujo de incorporación
    if (!perfil.equipo_id || perfil.estado_ingreso !== "aprobado") {
      router.push("/unirse");
      return;
    }

    if (perfil.rol === "jugador") {
      router.push("/jugador/agenda");
    } else {
      router.push("/entrenador/agenda");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-surface px-5 py-12">
      {/* Logo / marca */}
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

      {/* Tarjeta */}
      <div className="w-full max-w-sm bg-surface-container border border-outline-variant rounded-xl p-7">
        <h2 className="font-inter font-bold text-lg text-on-surface mb-1">
          Iniciar sesión
        </h2>
        <p className="font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-7">
          Acceso al panel de entrenamiento
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-inter text-sm focus:border-primary-container focus:outline-none transition-colors placeholder:text-on-surface-variant/40"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-inter text-sm focus:border-primary-container focus:outline-none transition-colors placeholder:text-on-surface-variant/40"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-error/10 border border-error/30 rounded-lg">
              <p className="font-inter text-xs text-error leading-relaxed">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-primary-container text-on-primary-fixed font-jetbrains text-[11px] tracking-[0.15em] font-black rounded-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "INGRESANDO..." : "INGRESAR"}
          </button>
        </form>

        {/* Link a registro */}
        <p className="mt-6 text-center font-jetbrains text-[10px] tracking-widest text-on-surface-variant">
          ¿No tenés cuenta?{" "}
          <Link
            href="/register"
            className="text-primary-container hover:underline transition-colors"
          >
            REGISTRATE
          </Link>
        </p>
      </div>

      {/* Dev note: mock selector */}
      <p className="mt-8 font-jetbrains text-[10px] text-on-surface-variant/30 tracking-widest uppercase">
        ¿Modo local?{" "}
        <Link href="/" className="hover:text-on-surface-variant/60 transition-colors">
          Ir al selector mock
        </Link>
      </p>
    </main>
  );
}
