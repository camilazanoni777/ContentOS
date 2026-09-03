import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ETAPAS_DO_FLUXO = [
  "Capturar ideia",
  "Pesquisar",
  "Roteirizar",
  "Preparar gravação",
  "Gravar",
  "Editar",
  "Aprovar",
  "Agendar",
  "Publicar",
  "Medir",
  "Aprender",
  "Reaproveitar",
];

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-secondary px-6 py-16">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <div className="flex flex-col items-start gap-3">
          <Badge variant="accent">Fundação do projeto</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Cami Content OS
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            O projeto está configurado. Esta é uma página inicial temporária —
            as páginas reais do fluxo de criação de conteúdo (Hoje, Banco de
            Ideias, Roteiros, Gravação, Edição, Agendamento, Publicados,
            Planejar, Analisar, Negócio e Configurações) serão implementadas
            nas próximas etapas.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fluxo de produção</CardTitle>
            <CardDescription>
              Uma ideia é um único registro que muda de status ao avançar por
              este fluxo — nunca é copiada para vários lugares.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-wrap gap-2">
              {ETAPAS_DO_FLUXO.map((etapa, index) => (
                <li
                  key={etapa}
                  className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                >
                  <span className="font-medium text-primary">
                    {index + 1}.
                  </span>
                  {etapa}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
