import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Só passe breadcrumbs quando realmente ajudarem a situar a usuária
   * (ex.: uma subpágina dentro de "Planejar") — não em toda página. */
  breadcrumbs?: Breadcrumb[];
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-3 border-b border-border/80 pb-5 sm:pb-6", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-foreground underline-offset-2 hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={isLast ? "font-medium text-foreground" : undefined}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {crumb.label}
                    </span>
                  )}
                  {!isLast ? (
                    <ChevronRight className="h-3 w-3 opacity-60" aria-hidden="true" />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 pt-1 sm:pt-0">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
