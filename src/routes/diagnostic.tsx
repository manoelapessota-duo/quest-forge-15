import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { QuestionRunner } from "@/components/game/QuestionRunner";
import { DIAGNOSTIC_QUESTIONS } from "@/game/diagnostic";
import { seededShuffle } from "@/game/rules";
import { useGame } from "@/game/state";

export const Route = createFileRoute("/diagnostic")({
  head: () => ({
    meta: [
      { title: "Prova do Espelho — PDI QUEST" },
      {
        name: "description",
        content: "A missão de diagnóstico que revela forças e lacunas do seu personagem.",
      },
      { property: "og:title", content: "Prova do Espelho — PDI QUEST" },
      { property: "og:description", content: "Doze desafios equilibrados entre os oito eixos do ofício." },
    ],
  }),
  component: DiagnosticScreen,
});

function DiagnosticScreen() {
  const { save, hydrated, recordAnswer, saveDiagnostic } = useGame();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (hydrated && !save.player) navigate({ to: "/character", replace: true });
  }, [hydrated, save.player, navigate]);

  const seed = String(save.player?.createdAt ?? "diagnostic");
  const questions = useMemo(() => seededShuffle(DIAGNOSTIC_QUESTIONS, seed), [seed]);
  const perAxis = useMemo<Record<string, { asked: number; correct: number }>>(() => ({}), []);

  if (save.progress.diagnostic && !started) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-display text-3xl text-parchment">A Prova do Espelho já foi enfrentada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Seu retrato inicial está guardado. Você pode revê-lo ou seguir para o mundo.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/diagnostic-result" })}
            className="rounded-md bg-primary px-5 py-2.5 text-primary-foreground"
          >
            Ver retrato
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/world" })}
            className="rounded-md border border-border px-5 py-2.5"
          >
            Ir ao mapa
          </button>
        </div>
      </main>
    );
  }

  if (!started) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <p className="text-xs tracking-[0.3em] text-primary uppercase">Missão inicial</p>
        <h1 className="mt-3 font-display text-3xl text-parchment sm:text-4xl">Prova do Espelho</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Doze perguntas gerais de ofício — nada específico do conteúdo do PDI. Não existe reprovação: o
          resultado apenas define em que parte da jornada você começa.
        </p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-8 rounded-md bg-primary px-6 py-3 font-display text-lg text-primary-foreground transition-opacity hover:opacity-90"
        >
          Encarar o espelho
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="mb-5 font-display text-2xl text-parchment">Prova do Espelho</h1>
      <QuestionRunner
        questions={questions}
        seed={seed}
        finishLabel="Revelar meu retrato"
        onAnswer={(question, index) => {
          const outcome = recordAnswer(question, index, "diagnostic");
          const entry = perAxis[question.axis] ?? { asked: 0, correct: 0 };
          perAxis[question.axis] = {
            asked: entry.asked + 1,
            correct: entry.correct + (outcome.correct ? 1 : 0),
          };
          return outcome;
        }}
        onFinish={() => {
          saveDiagnostic({ at: Date.now(), perAxis: { ...perAxis } });
          navigate({ to: "/diagnostic-result" });
        }}
      />
    </main>
  );
}
