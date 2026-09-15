import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/game/Shell";
import { useGame } from "@/game/state";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Ajustes — PDI QUEST" },
      { name: "description", content: "Som, animações e reinício de progresso do PDI QUEST." },
      { property: "og:title", content: "Ajustes — PDI QUEST" },
      { property: "og:description", content: "Controle som, movimento e dados salvos no navegador." },
    ],
  }),
  component: SettingsScreen,
});

function SettingsScreen() {
  const { save, updateSettings, resetGame } = useGame();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  const toggles = [
    { key: "sound" as const, label: "Sons sintéticos", hint: "Efeitos discretos de acerto, portal e nível." },
    { key: "animations" as const, label: "Animações do mundo", hint: "Movimento de água, portais e partículas." },
  ];

  return (
    <Shell>
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="font-display text-3xl text-parchment">Ajustes</h1>

        <section className="quest-panel mt-6 rounded-xl p-5">
          <ul className="space-y-4">
            {toggles.map((toggle) => (
              <li key={toggle.key} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground">{toggle.label}</p>
                  <p className="text-xs text-muted-foreground">{toggle.hint}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={save.settings[toggle.key]}
                  aria-label={toggle.label}
                  onClick={() => updateSettings({ [toggle.key]: !save.settings[toggle.key] })}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    save.settings[toggle.key] ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 size-5 rounded-full bg-card transition-[left] ${
                      save.settings[toggle.key] ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="quest-panel mt-5 rounded-xl p-5">
          <h2 className="font-display text-lg text-parchment">Progresso</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu progresso fica salvo apenas neste navegador e neste computador. Reiniciar apaga personagem,
            respostas, XP e conquistas.
          </p>
          {confirming ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  resetGame();
                  navigate({ to: "/" });
                }}
                className="rounded-md bg-destructive px-5 py-2.5 text-sm text-destructive-foreground"
              >
                Confirmar reinício
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-md border border-border px-5 py-2.5 text-sm"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-4 rounded-md border border-destructive/60 px-5 py-2.5 text-sm text-destructive"
            >
              Reiniciar progresso
            </button>
          )}
        </section>

        <Link to="/direction" className="mt-5 inline-block text-sm text-primary underline-offset-4 hover:underline">
          Abrir Modo Direção (métricas locais)
        </Link>
      </main>
    </Shell>
  );
}
