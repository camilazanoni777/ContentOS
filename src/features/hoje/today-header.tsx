import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InstagramAccount } from "@/types/domain";

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface TodayHeaderProps {
  greeting: string;
  formattedDate: string;
  activeAccount: InstagramAccount | null;
}

export function TodayHeader({ greeting, formattedDate, activeAccount }: TodayHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {activeAccount ? (
            <Link
              href="/configuracoes"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/60 px-2.5 py-0.5 text-xs font-semibold text-primary transition-colors hover:bg-secondary hover:border-primary/40"
              title="Conta ativa — gerenciar em Configurações"
            >
              <InstagramIcon className="h-3 w-3" aria-hidden="true" />
              <span>@{activeAccount.handle}</span>
            </Link>
          ) : (
            <Link
              href="/configuracoes"
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <InstagramIcon className="h-3 w-3" aria-hidden="true" />
              <span>Conectar conta</span>
            </Link>
          )}
        </div>

        <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {greeting}
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          {formattedDate}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <Button asChild size="default" className="gap-1.5 shadow-xs">
          <Link href="/ideias?acao=nova">
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Nova ideia</span>
          </Link>
        </Button>
        <Button asChild variant="outline" size="default" className="gap-1.5">
          <Link href="/checkin">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Check-in</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
