"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword, signUpWithPassword } from "@/lib/auth/actions";
import { loginSchema, passwordSchema, type LoginInput } from "@/lib/validations/auth";
import { safeNextPath } from "@/lib/safe-redirect";

type Modo = "login" | "cadastro";

export function LoginForm() {
  const [modo, setModo] = useState<Modo>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginInput) {
    setFormError(null);
    setSignUpSuccess(false);

    if (modo === "cadastro") {
      const senhaValida = passwordSchema.safeParse(values.password);
      if (!senhaValida.success) {
        setFormError("A senha precisa ter pelo menos 8 caracteres.");
        return;
      }
    }

    startTransition(async () => {
      const result =
        modo === "login" ? await signInWithPassword(values) : await signUpWithPassword(values);

      if ("error" in result) {
        setFormError(result.error);
        return;
      }

      if (modo === "cadastro") {
        setSignUpSuccess(true);
        return;
      }

      router.push(safeNextPath(searchParams.get("proximo")));
      router.refresh();
    });
  }

  const carregando = isSubmitting || isPending;

  return (
    <div className="flex flex-col gap-6">
      {/* Seletor de Modo (Tabs modernas) */}
      <div className="grid grid-cols-2 rounded-xl bg-muted/80 p-1 text-sm font-medium border border-border/50">
        <button
          type="button"
          onClick={() => {
            setModo("login");
            setFormError(null);
            setSignUpSuccess(false);
          }}
          className={`flex items-center justify-center rounded-lg py-2 transition-all duration-150 cursor-pointer ${
            modo === "login"
              ? "bg-card text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => {
            setModo("cadastro");
            setFormError(null);
            setSignUpSuccess(false);
          }}
          className={`flex items-center justify-center rounded-lg py-2 transition-all duration-150 cursor-pointer ${
            modo === "cadastro"
              ? "bg-card text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Criar conta
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Campo E-mail */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-foreground">
            E-mail
          </Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="email"
              type="email"
              placeholder="seu.email@exemplo.com"
              autoComplete="email"
              className="pl-9 bg-card border-input focus-visible:ring-primary h-10"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </div>
          {errors.email ? (
            <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
          ) : null}
        </div>

        {/* Campo Senha */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium text-foreground">
              Senha
            </Label>
            {modo === "cadastro" ? (
              <span className="text-2xs text-muted-foreground">Mínimo 8 caracteres</span>
            ) : null}
          </div>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete={modo === "login" ? "current-password" : "new-password"}
              className="pl-9 pr-10 bg-card border-input focus-visible:ring-primary h-10"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? (
            <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
          ) : null}
        </div>

        {/* Alerta de Erro */}
        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in-50"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{formError}</span>
          </div>
        ) : null}

        {/* Alerta de Sucesso no Cadastro */}
        {signUpSuccess ? (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-lg border border-tone-success-fg/20 bg-tone-success-bg p-3 text-xs text-tone-success-fg animate-in fade-in-50"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-tone-success-fg" />
            <span className="leading-tight">
              Conta criada com sucesso! Verifique seu e-mail para confirmar seu cadastro antes de acessar.
            </span>
          </div>
        ) : null}

        {/* Botão de Envio */}
        <Button
          type="submit"
          disabled={carregando}
          className="mt-2 w-full h-11 text-sm font-semibold shadow-sm"
        >
          {carregando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processando...
            </>
          ) : modo === "login" ? (
            "Entrar na plataforma"
          ) : (
            "Criar minha conta"
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Ao continuar, você concorda com a privacidade e termos do seu Content OS.
      </p>
    </div>
  );
}
