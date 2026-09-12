import { Link, createFileRoute } from "@tanstack/react-router";
import { MATERIALS, axisName } from "@/game/data";
import { getQuestStatus } from "@/game/rules";
import { useGame } from "@/game/state";

export const Route = createFileRoute("/diagnostic-result")({
  head: () => ({
    meta: [
      { title: "Retrato do personagem — PDI QUEST" },
      { name: "description", content: "Forças, lacunas e o próximo caminho do seu personagem." },
      { property: "og:title", content: "Retrato do personagem — PDI QUEST" },
      { property: "og:description", content: "O resultado da Prova do Espelho por eixo do ofício." },
    ],
  }),
  component: DiagnosticResultScreen,
});

function DiagnosticResultScreen() {
  const { save } = useGame();
  const diagnostic = save.progress.diagnostic;

  if (!diagnostic) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-display text-3xl text-parchment">Nenhum retrato ainda</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enfrente a Prova do Espelho para revelar suas forças e lacunas.
        </p>
        <Link to="/diagnostic" className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-primary-foreground">
          Ir à prova
        </Link>
      </main>
    );
  }

  const rows = Object.entries(diagnostic.perAxis)
    .map(([axis, value]) => ({
      axis,
      name: axisName(axis),
      ...value,
      accuracy: value.asked ? Math.round((value.correct / value.asked) * 100) : 0,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  const strengths = rows.filter((r) => r.accuracy >= 60);
  const gaps = rows.filter((r) => r.accuracy < 60);
  const gapAxes = new Set(gaps.map((g) => g.axis));
  const recommended = MATERIALS.filter(
    (m) => gapAxes.has(m.axis) && getQuestStatus(save, m.id) !== "locked" && getQuestStatus(save, m.id) !== "completed",
  ).slice(0, 4);

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs tracking-[0.3em] text-primary uppercase">Retrato revelado</p>
      <h1 className="mt-3 font-display text-3xl text-parchment sm:text-4xl">
        {save.player?.name ?? "Viajante"}, o espelho falou
      </h1>

      <section className="quest-panel mt-8 rounded-xl p-5">
        <h2 className="font-display text-xl text-parchment">Status por eixo</h2>
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.axis}>
              <div className="flex justify-between text-sm">
                <span className="text-foreground">{row.name}</span>
                <span className="text-muted-foreground">
                  {row.correct}/{row.asked} · {row.accuracy}%
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(4, row.accuracy)}%`,
                    background: row.accuracy >= 60 ? "var(--success)" : "var(--primary)",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="quest-panel rounded-xl p-5">
          <h2 className="font-display text-lg text-success">Pontos fortes</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {strengths.length ? (
              strengths.map((s) => <li key={s.axis}>{s.name}</li>)
            ) : (
              <li>Tudo em aberto — o mundo inteiro é território de crescimento.</li>
            )}
          </ul>
        </section>
        <section className="quest-panel rounded-xl p-5">
          <h2 className="font-display text-lg text-primary">Lacunas</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {gaps.length ? gaps.map((g) => <li key={g.axis}>{g.name}</li>) : <li>Nenhuma lacuna evidente.</li>}
          </ul>
        </section>
      </div>

      {recommended.length > 0 && (
        <section className="quest-panel mt-6 rounded-xl p-5">
          <h2 className="font-display text-xl text-parchment">Seu próximo caminho</h2>
          <ul className="mt-3 space-y-2">
            {recommended.map((material) => (
              <li key={material.id}>
                <Link
                  to="/quest/$questId"
                  params={{ questId: material.id }}
                  className="block rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm transition-colors hover:border-primary/60"
                >
                  <span className="text-foreground">{material.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{axisName(material.axis)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        to="/world"
        className="mt-8 inline-block rounded-md bg-primary px-6 py-3 font-display text-lg text-primary-foreground transition-opacity hover:opacity-90"
      >
        Abrir o mapa do mundo
      </Link>
    </main>
  );
}
