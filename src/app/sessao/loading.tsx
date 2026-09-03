import { LoadingState } from "@/components/feedback/states";

export default function SessaoLoading() {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg items-center justify-center p-4">
      <LoadingState label="Verificando sessão..." />
    </main>
  );
}
