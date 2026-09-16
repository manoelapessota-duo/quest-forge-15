import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getLevelProgress, getLevelTitle, getXPForNextLevel } from "@/game/rules";
import { CLASSES } from "@/game/data";
import { useGame } from "@/game/state";
import { useAuth } from "@/auth/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

const NAV = [
  { to: "/world", label: "Mundo" },
  { to: "/backpack", label: "Mochila" },
  { to: "/profile", label: "Personagem" },
  { to: "/competencies", label: "Competências" },
  { to: "/weekly-boss", label: "Chefão" },
  { to: "/settings", label: "Ajustes" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const { save, level, saving } = useGame();
  const { profile, isAdmin, signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    void navigate({ to: "/auth", replace: true });
  };
  const player = save.player;
  const xp = player?.xp ?? 0;
  const { next } = getXPForNextLevel(xp);
  const glyph = CLASSES.find((c) => c.id === player?.classId)?.glyph ?? "✶";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/world" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full border border-primary/50 bg-primary/15 text-lg text-primary">
              {glyph}
            </span>
            <span className="font-display text-lg leading-none text-parchment">PDI QUEST</span>
          </Link>

          <div className="ml-auto flex min-w-52 flex-1 flex-col gap-1 sm:max-w-72">
            <div className="flex items-baseline justify-between text-xs text-muted-foreground">
              <span className="truncate">
                {player?.name ?? "Viajante"} · Nível {level} · {getLevelTitle(level)}
              </span>
              <span>{next ? `${xp}/${next}` : `${xp} XP`}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${getLevelProgress(xp)}%` }}
              />
            </div>
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2 text-sm">
          {[...NAV, ...(isAdmin ? [{ to: "/admin", label: "Guardiões" } as const] : [])].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-1.5 whitespace-nowrap text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-primary" }}
            >
              {item.label}
            </Link>
          ))}
          <div className="ml-auto flex items-center gap-2 pl-2 text-xs text-muted-foreground">
            <span className="hidden max-w-40 truncate sm:inline">{profile?.full_name ?? profile?.email ?? ""}</span>
            <span aria-live="polite">{saving ? "Salvando…" : "Salvo"}</span>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="rounded-md border border-border px-3 py-1.5 whitespace-nowrap transition-colors hover:bg-secondary"
            >
              Sair
            </button>
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
