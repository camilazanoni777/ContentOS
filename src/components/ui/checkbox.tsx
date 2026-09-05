"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * Checkbox custom (input real por baixo, para acessibilidade/teclado
 * nativos) — usado no checklist do check-in, onde precisamos de uma área de
 * toque grande no mobile e feedback visual claro de marcado/desmarcado.
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, id, ...props }, ref) => {
    return (
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="peer absolute inset-0 h-5 w-5 cursor-pointer opacity-0"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-md border border-input bg-background transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            checked && "border-accent bg-accent text-accent-foreground",
            className,
          )}
        >
          {checked ? <Check className="h-3.5 w-3.5" /> : null}
        </span>
      </span>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
