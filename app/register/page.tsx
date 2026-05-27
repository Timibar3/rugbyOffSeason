"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function traducirError(msg: string): string {
  if (msg.includes("already registered"))      return "Ya existe una cuenta con ese email.";
  if (msg.includes("Password should be"))      return "La contraseña debe tener al menos 6 caracteres.";
  if (msg.includes("Unable to validate email")) return "El formato del email no es válido.";
  if (msg.includes("Too many requests"))        return "Demasiados intentos. Esperá unos minutos.";
  return msg;
}

export default function RegisterPage() {
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail]                   = useState("");
  const [password, setPassword]             = useState("");
  const [error, setError]                   = useState<string | null>(null);
  const [loading, setLoading]               = useState(false);
  const [registrado, setRegistrado]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // El trigger fn_crear_perfil_nuevo_usuario lee este campo
        // para completar perfiles.nombre_completo automáticamente.
        data: { nombre_completo: nombreCompleto.trim() },
      },
    });

    if (authError) {
      setError(traducirError(authError.message));
      setLoading(false);
      return;
    }

    setRegistrado(true);
    setLoading(false);
  }

  // ── Estado: registro exitoso ───────────────────────────────────────────────
  if (registrado) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-surface px-5 py-12">
        <div className="w-full max-w-sm bg-surface-container border border-outline-variant rounded-xl p-8 text-center">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full bg-primary-container/15 border border-primary-container/30 flex items-center justify-center">
              <CheckCircle2 className="text-primary-container" size={28} />
            </div>
          </div>

          <h2 className="font-inter font-bold text-xl text-on-surface mb-2">
            ¡Registro exitoso!
          </h2>

          <p className="font-inter text-sm text-on-surface-variant leading-relaxed mb-3">
            Tu cuenta fue creada. El próximo paso es ingresar el{" "}
            <span className="text-on-surface font-medium">código de tu equipo</span>{" "}
            para solicitar el acceso.
          </p>

          <div className="my-5 p-4 bg-surface-container-high border border-outline-variant rounded-lg text-left space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="font-jetbrains text-[10px] text-primary-container mt-0.5">01</span>
              <p className="font-inter text-xs text-on-surface-variant">
                Confirmá tu email si Supabase lo requiere.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="font-jetbrains text-[10px] text-primary-container mt-0.5">02</span>
              <p className="font-inter text-xs text-on-surface-variant">
                Iniciá sesión e ingresá el código que te dio tu Head Coach.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="font-jetbrains text-[10px] text-primary-container mt-0.5">03</span>
              <p className="font-inter text-xs text-on-surface-variant">
                El Head Coach aprueba tu ingreso y te asigna las posiciones.
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="block w-full py-3.5 bg-primary-container text-on-primary-fixed font-jetbrains text-[11px] tracking-[0.15em] font-black rounded-lg hover:opacity-90 active:scale-[0.98] transition-all text-center"
          >
            IR AL LOGIN
          </Link>
        </div>
      </main>
    );
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
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
          Crear cuenta
        </h2>
        <p className="font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-7">
          Nuevo jugador o miembro del staff
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block font-jetbrains text-[10px] tracking-widest text-on-surface-variant uppercase mb-2">
              Nombre completo
            </label>
            <input
              type="text"
              required
              autoComplete="name"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-inter text-sm focus:border-primary-container focus:outline-none transition-colors placeholder:text-on-surface-variant/40"
            />
          </div>

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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
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
            {loading ? "CREANDO CUENTA..." : "CREAR CUENTA"}
          </button>
        </form>

        {/* Link a login */}
        <p className="mt-6 text-center font-jetbrains text-[10px] tracking-widest text-on-surface-variant">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="text-primary-container hover:underline transition-colors"
          >
            INICIÁ SESIÓN
          </Link>
        </p>
      </div>
    </main>
  );
}
