import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/feedback/states";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { getProfile } from "@/lib/data/profiles";
import { DataAccessError } from "@/lib/data/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * Página protegida de verificação de sessão. Não é uma tela final do
 * produto — apenas confirma que a autenticação, o middleware e a camada de
 * acesso a dados estão funcionando de ponta a ponta antes de construirmos as
 * telas reais nas próximas fases.
 */
export default async function SessaoPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return (
      <main className="mx-auto flex min-h-svh max-w-lg items-center justify-center p-4">
        <ErrorState
          title="Supabase não configurado"
          description="Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no seu .env.local (veja .env.example) para verificar a sessão."
        />
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Em condições normais o middleware já redireciona antes de chegar aqui;
  // este é apenas um segundo cinto de segurança.
  if (!user) {
    redirect("/login?proximo=/sessao");
  }

  let profile = null;
  let loadError: string | null = null;
  try {
    profile = await getProfile(supabase, user.id);
  } catch (error) {
    loadError =
      error instanceof DataAccessError ? error.message : "Não foi possível carregar seu perfil.";
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-6 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sessão ativa</CardTitle>
            <Badge variant="accent">Autenticado</Badge>
          </div>
          <CardDescription>
            Esta página confirma que o login, o middleware e a leitura de dados no Supabase estão
            funcionando corretamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">ID do usuário</dt>
              <dd className="font-mono text-xs">{user.id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Nome de exibição</dt>
              <dd className="font-medium">{profile?.display_name ?? "Não definido"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Fuso horário</dt>
              <dd className="font-medium">{profile?.timezone ?? "Não definido"}</dd>
            </div>
          </dl>

          {loadError ? (
            <ErrorState title="Perfil não pôde ser carregado" description={loadError} />
          ) : null}

          <SignOutButton />
        </CardContent>
      </Card>
    </main>
  );
}
