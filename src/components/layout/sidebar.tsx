"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Navegação lateral — visível a partir de telas médias (md:), oculta no mobile (ver BottomNav). */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="hidden w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex"
    >
      <Link href="/hoje" className="flex items-center gap-2 px-2">
        <span className="font-serif text-lg font-semibold text-sidebar-foreground">Cami Content OS</span>
      </Link>

      <div className="flex flex-col gap-5">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.label ?? `group-${groupIndex}`} className="flex flex-col gap-1">
            {group.label ? (
              <h2 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h2>
            ) : null}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/80 hover:bg-secondary hover:text-secondary-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
