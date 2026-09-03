import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Não foi possível confirmar o acesso</CardTitle>
          <CardDescription>
            O link usado pode ter expirado ou já ter sido utilizado. Tente entrar novamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/login">Voltar para o login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
