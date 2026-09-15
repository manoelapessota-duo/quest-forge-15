import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import bossArt from "@/assets/pdi-weekly-boss.jpg";
import { Shell } from "@/components/game/Shell";
import { QuestionRunner, type RunnerResult } from "@/components/game/QuestionRunner";
import { buildWeeklyBoss, canPlayWeeklyBoss, getWeekKey } from "@/game/rules";
import { useGame } from "@/game/state";

export const Route = createFileRoute("/weekly-boss")({
  head: () => ({
    meta: [
      { title: "Chefão Semanal — PDI QUEST" },
      { name: "description", content: "Uma tentativa por semana, dez desafios, XP dobrado e troféu semanal." },
      { property: "og:title", content: "Chefão Semanal — PDI QUEST" },
      { property: "og:description", content: "O Guardião dos Cristais espera uma vez por semana." },
    ],
  }),
  component: WeeklyBossScreen,
});

function WeeklyBossScreen() {
  const { save, recordAnswer, recordBossRun } = useGame();
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<(RunnerResult & { bonus: number; trophy: boolean }) | null>(null);

  const weekKey = getWeekKey();
  const available = canPlayWeeklyBoss(save);
  const questions = useMemo(() => buildWeeklyBoss(weekKey + (save.player?.createdAt ?? "")), [weekKey, save.player?.createdAt]);
  const history = [...save.weeklyBoss].reverse();

  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs tracking-[0.3em] text-primary uppercase">Arena semanal · {weekKey}</p>
        <h1 className="mt-3 font-display text-3xl text-parchment">Chefão Semanal</h1>

        {!started && !result && (
          <>
            <img
              src={bossArt}
              alt="Arena original com o guardião de pedra e cristais de conhecimento do PDI QUEST"
              className="mt-5 w-full rounded-xl border border-border object-cover"
            />
            <div className="quest-panel mt-5 rounded-xl p-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Dez desafios na composição oficial: 2 leves, 3 médias, 3 avançadas e 2 de desafio. O XP vale em dobro
                e 8 ou mais acertos rendem 200 XP extras e o troféu da semana. Apenas uma tentativa por semana.
              </p>
              {available ? (
                <button
                  type="button"
                  onClick={() => setStarted(true)}
                  className="mt-5 rounded-md bg-primary px-6 py-3 font-display text-lg text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Entrar na arena
                </button>
              ) : (
                <p className="mt-5 rounded-md border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
                  Você já enfrentou o Chefão nesta semana. A arena reabre na próxima semana.
                </p>
              )}
            </div>
          </>
        )}

        {started && !result && (
          <div className="mt-6">
            <QuestionRunner
              questions={questions}
              seed={weekKey}
              finishLabel="Encerrar combate"
              onAnswer={(question, index) => {
                const outcome = recordAnswer(question, index, "boss");
                return { correct: outcome.correct, xpAwarded: outcome.xpAwarded * 2 };
              }}
              onFinish={(runResult) => {
                const trophy = runResult.correct >= 8;
                const bonus = trophy ? 200 : 0;
                recordBossRun(runResult.correct, runResult.total, runResult.xp + bonus, trophy);
                setResult({ ...runResult, bonus, trophy });
              }}
            />
          </div>
        )}

        {result && (
          <div className="quest-panel mt-6 rounded-xl p-6 text-center">
            <h2 className="font-display text-2xl text-parchment">
              {result.trophy ? "Guardião derrotado!" : "O Guardião resistiu"}
            </h2>
            <p className="mt-3 text-lg">
              {result.correct}/{result.total} acertos ·{" "}
              <span className="text-primary">+{result.xp + result.bonus} XP</span>
            </p>
            {result.trophy && <p className="mt-2 text-sm text-success">Troféu semanal e bônus de 200 XP conquistados.</p>}
          </div>
        )}

        {history.length > 0 && (
          <section className="quest-panel mt-6 rounded-xl p-5">
            <h2 className="font-display text-xl text-parchment">Histórico</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {history.map((run) => (
                <li key={run.weekKey} className="flex justify-between rounded-lg bg-secondary/30 px-3 py-2">
                  <span>
                    {run.trophy ? "🏆" : "•"} {run.weekKey}
                  </span>
                  <span className="text-muted-foreground">
                    {run.correct}/{run.total} · {run.xp} XP
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </Shell>
  );
}
