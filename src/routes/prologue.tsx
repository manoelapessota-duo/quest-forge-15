import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CLASSES } from "@/game/data";
import { useGame } from "@/game/state";

export const Route = createFileRoute("/prologue")({
  head: () => ({
    meta: [
      { title: "Prólogo — PDI QUEST" },
      { name: "description", content: "A abertura da jornada no Vale de Aurora." },
      { property: "og:title", content: "Prólogo — PDI QUEST" },
      { property: "og:description", content: "Como a jornada do ofício começa." },
    ],
  }),
  component: PrologueScreen,
});

function PrologueScreen() {
  const { save, hydrated, markPrologueSeen } = useGame();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (hydrated && !save.player) navigate({ to: "/character", replace: true });
  }, [hydrated, save.player, navigate]);

  const className = CLASSES.find((c) => c.id === save.player?.classId)?.name ?? "viajante";
  const scenes = [
    {
      speaker: "Mestra Idra, guardiã da Vila do Vale",
      text: `Você chega ao Vale de Aurora com as mãos ainda limpas de terra, ${save.player?.name ?? "viajante"}. Aqui o ofício não se herda: se caminha.`,
    },
    {
      speaker: "Mestra Idra",
      text: `Como ${className}, você tem um jeito próprio de ler o mundo. Guarde isso: o traço, o rastro e o encanto são caminhos diferentes para a mesma maestria.`,
    },
    {
      speaker: "Mestra Idra",
      text: "Quatro territórios se abrem além destes campos. Cada oficina, biblioteca e ruína guarda um saber real, e cada saber cobra prática antes de entregar poder.",
    },
    {
      speaker: "Mestra Idra",
      text: "Antes do mapa, preciso ver do que você já é capaz. Enfrente a Prova do Espelho: dela sai o seu primeiro retrato de forças e lacunas.",
    },
  ];

  const scene = scenes[step]!;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-12">
      <p className="text-xs tracking-[0.3em] text-primary uppercase">Prólogo</p>
      <div className="quest-panel mt-4 rounded-xl p-6 sm:p-8">
        <p className="font-display text-lg text-primary">{scene.speaker}</p>
        <p className="mt-4 text-lg leading-relaxed text-parchment">{scene.text}</p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        {step < scenes.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded-md bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              markPrologueSeen();
              navigate({ to: "/diagnostic" });
            }}
            className="rounded-md bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Enfrentar a Prova do Espelho
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            markPrologueSeen();
            navigate({ to: "/diagnostic" });
          }}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Pular narrativa
        </button>
        <span className="ml-auto text-xs text-muted-foreground">
          {step + 1}/{scenes.length}
        </span>
      </div>
    </main>
  );
}
