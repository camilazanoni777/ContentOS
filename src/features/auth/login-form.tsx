"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword, signUpWithPassword } from "@/lib/auth/actions";
import { loginSchema, passwordSchema, type LoginInput } from "@/lib/validations/auth";
import { safeNextPath } from "@/lib/safe-redirect";

type Modo = "login" | "cadastro";

export function LoginForm() {
  const [modo, setModo] = useState<Modo>("login");
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex gap-2 rounded-md bg-secondary p-1 text-sm">
        <button
          type="button"
          onClick={() => {
            setModo("login");
            setFormError(null);
            setSignUpSuccess(false);
          }}
          className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
            modo === "login" ? "bg-background shadow-sm" : "text-muted-foreground"
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
          className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
            modo === "cadastro" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          Criar conta
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete={modo === "login" ? "current-password" : "new-password"}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      {signUpSuccess ? (
        <p className="text-sm text-foreground">
          Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.
        </p>
      ) : null}

      <Button type="submit" disabled={carregando}>
        {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta"}
      </Button>
    </form>
  );
}
