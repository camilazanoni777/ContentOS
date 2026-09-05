import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";

export default function PreviewOnboardingPage() {
  return (
    <main className="flex min-h-svh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 px-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-sans font-bold text-sm shadow-2xs">
            C
          </div>
          <span className="font-sans font-bold tracking-tight text-foreground text-sm">
            Cami Content OS
          </span>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <OnboardingWizard />
      </div>
    </main>
  );
}
