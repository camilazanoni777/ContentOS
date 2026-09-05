import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar — Cami Content OS",
  description: "Acesse sua conta do Cami Content OS.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Cami Content OS</CardTitle>
          <CardDescription>Entre com seu e-mail e senha para acessar sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
