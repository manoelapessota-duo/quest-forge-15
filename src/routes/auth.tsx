import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/auth/AuthProvider";
import titleArt from "@/assets/pdi-world-title.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — PDI QUEST" },
      { name: "description", content: "Entre com sua conta Google para retomar sua jornada no PDI QUEST." },
      { property: "og:title", content: "Entrar — PDI QUEST" },
      { property: "og:description", content: "Sua jornada de desenvolvimento fica salva na sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthScreen,
});

function AuthScreen() {
  const { session, loading, error, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) void navigate({ to: "/", replace: true });
  }, [session, navigate]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <img
        src={titleArt}
        alt="Vista do mundo do PDI QUEST ao anoitecer"
        className="absolute inset-0 size-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <p className="text-xs tracking-[0.35em] text-primary uppercase">Portal do Vale</p>
        <h1 className="mt-3 font-display text-4xl text-parchment sm:text-5xl">PDI QUEST</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Guardiões do portal registram cada viajante. Entre com sua conta para que sua jornada, seu XP e sua
          mochila sigam com você em qualquer dispositivo.
        </p>

        <div className="quest-panel mt-8 w-full rounded-xl p-6">
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <span aria-hidden className="grid size-5 place-items-center rounded-full bg-primary-foreground/90 text-xs text-primary">
              G
            </span>
            {loading ? "Abrindo o portal…" : "Entrar com Google"}
          </button>

          {error ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              Usamos apenas seu nome, e-mail e foto para identificar seu personagem.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
