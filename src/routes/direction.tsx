import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/game/Shell";
import { QUESTIONS, REGIONS, TOTAL_QUESTIONS, axisName } from "@/game/data";
import { getAxisStats, getRegionProgress, getTopMistakes } from "@/game/rules";
import { useGame } from "@/game/state";

export const Route = createFileRoute("/direction")({
  head: () => ({
    meta: [
      { title: "Modo Direção — PDI QUEST" },
      { name: "description", content: "Métricas agregadas de aprendizado deste navegador, sem ranking individual." },
      { property: "og:title", content: "Modo Direção — PDI QUEST" },
      { property: "og:description", content: "Cobertura, acurácia e principais erros para leitura de gestão." },
    ],
  }),
  component: DirectionScreen,
});

function DirectionScreen() {
  const { save, level } = useGame();
  const answered = new Set(save.answers.map((a) => a.questionId)).size;
  const accuracy = save.answers.length
    ? Math.round((save.answers.filter((a) => a.correct).length / save.answers.length) * 100)
    : 0;
  const stats = getAxisStats(save);
  const mistakes = getTopMistakes(save, 10);

  return (
    <Shell>
      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="font-display text-3xl text-parchment">Modo Direção</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Leitura agregada do aprendizado registrado neste navegador. Sem ranking individual e sem comparação
          entre pessoas.
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Nível", value: String(level) },
            { label: "Acurácia", value: `${accuracy}%` },
            { label: "Cobertura", value: `${Math.round((answered / TOTAL_QUESTIONS) * 100)}%` },
            { label: "Missões", value: `${save.progress.completedQuests.length}/48` },
          ].map((item) => (
            <div key={item.label} className="quest-panel rounded-lg p-4">
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 font-display text-2xl text-primary">{item.value}</dd>
            </div>
          ))}
        </dl>

        <section className="quest-panel mt-5 rounded-xl p-5">
          <h2 className="font-display text-xl text-parchment">Eixos</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {stats.map((stat) => (
              <li key={stat.axis} className="flex justify-between rounded-lg bg-secondary/30 px-3 py-2">
                <span>{stat.name}</span>
                <span className="text-muted-foreground">
                  acurácia {stat.accuracy}% · cobertura {stat.coverage}%
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="quest-panel mt-5 rounded-xl p-5">
          <h2 className="font-display text-xl text-parchment">Territórios</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {REGIONS.map((region) => {
              const rp = getRegionProgress(save, region.id);
              return (
                <li key={region.id} className="flex justify-between rounded-lg bg-secondary/30 px-3 py-2">
                  <span>{region.name}</span>
                  <span className="text-muted-foreground">
                    {rp.done}/{rp.total} missões
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="quest-panel mt-5 rounded-xl p-5">
          <h2 className="font-display text-xl text-parchment">Top 10 erros recorrentes</h2>
          {mistakes.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nenhum erro registrado até agora.</p>
          ) : (
            <ol className="mt-3 space-y-2 text-sm">
              {mistakes.map((mistake) => {
                const question = QUESTIONS.find((q) => q.id === mistake.questionId);
                return (
                  <li key={mistake.questionId} className="rounded-lg bg-secondary/30 px-3 py-2">
                    <p className="text-foreground">{question?.prompt ?? mistake.questionId}</p>
                    <p className="text-xs text-muted-foreground">
                      {question ? axisName(question.axis) : "—"} · {mistake.misses} erro(s)
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </main>
    </Shell>
  );
}
