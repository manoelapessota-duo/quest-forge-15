import { useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { useGame } from "@/game/state";
import { LoginPanel } from "./LoginPanel";

const PUBLIC_PATHS = ["/auth"];

function JourneyLoader({ message }: { message: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div>
        <div
          aria-hidden
          className="mx-auto size-12 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
        />
        <p className="mt-5 font-display text-lg text-parchment">{message}</p>
        <p className="mt-2 text-xs text-muted-foreground">Aguarde: nada será sobrescrito.</p>
      </div>
    </div>
  );
}

/** Garante sessão e progresso carregados antes de qualquer tela de jogo. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const { hydrated } = useGame();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (isPublic) return <>{children}</>;
  if (loading) return <JourneyLoader message="Abrindo o portal…" />;
  if (!session) return <LoginPanel />;
  if (!hydrated) return <JourneyLoader message="Restaurando sua jornada…" />;
  return <>{children}</>;
}
