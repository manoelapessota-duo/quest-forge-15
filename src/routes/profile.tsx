import { Link, createFileRoute } from "@tanstack/react-router";
import { ACHIEVEMENTS, CLASSES, REGIONS, TOTAL_QUESTIONS } from "@/game/data";
import { Shell } from "@/components/game/Shell";
import {
  canChangeClass,
  getLevelProgress,
  getLevelTitle,
  getRegionProgress,
  getXPForNextLevel,
  isRegionUnlocked,
} from "@/game/rules";
import { useGame } from "@/game/state";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Ficha do personagem — PDI QUEST" },
      { name: "description", content: "Nível, XP, missões, acurácia, territórios e troféus do seu personagem." },
      { property: "og:title", content: "Ficha do personagem — PDI QUEST" },
      { property: "og:description", content: "Todo o seu progresso no mundo do PDI QUEST." },
    ],
  }),
  component: ProfileScreen,
});

function ProfileScreen() {
  const { save, level, changeClass } = useGame();
  const player = save.player;

  if (!player) {
    return (
      <Shell>
        <main className="mx-auto max-w-2xl px-5 py-16">
          <h1 className="font-display text-2xl text-parchment">Nenhum personagem criado</h1>
          <Link to="/character" className="mt-4 inline-block rounded-md bg-primary px-5 py-2.5 text-primary-foreground">
            Criar personagem
          </Link>
        </main>
      </Shell>
    );
  }

  const cls = CLASSES.find((c) => c.id === player.classId)!;
  const { next } = getXPForNextLevel(player.xp);
  const answered = new Set(save.answers.map((a) => a.questionId)).size;
  const accuracy = save.answers.length
    ? Math.round((save.answers.filter((a) => a.correct).length / save.answers.length) * 100)
    : 0;
  const canSwap = canChangeClass(save);

  return (
    <Shell>
      <main className="mx-auto max-w-4xl px-5 py-10">
        <section className="quest-panel rounded-xl p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid size-16 place-items-center rounded-full border border-primary/50 bg-primary/15 text-3xl text-primary">
              {cls.glyph}
            </span>
            <div>
              <h1 className="font-display text-3xl text-parchment">{player.name}</h1>
              <p className="text-sm text-primary">
                {cls.name} · Nível {level} · {getLevelTitle(level)}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{player.xp} XP</span>
              <span>{next ? `Próximo nível: ${next} XP` : "Nível máximo alcançado"}</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${getLevelProgress(player.xp)}%` }} />
            </div>
          </div>
        </section>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Missões concluídas", value: `${save.progress.completedQuests.length}/48` },
            { label: "Selos de domínio", value: String(save.progress.masteredQuests.length) },
            { label: "Desafios respondidos", value: `${answered}/${TOTAL_QUESTIONS}` },
            { label: "Acurácia", value: `${accuracy}%` },
          ].map((item) => (
            <div key={item.label} className="quest-panel rounded-lg p-4">
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 font-display text-2xl text-primary">{item.value}</dd>
            </div>
          ))}
        </dl>

        <section className="quest-panel mt-5 rounded-xl p-5">
          <h2 className="font-display text-xl text-parchment">Territórios</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {REGIONS.map((region) => {
              const rp = getRegionProgress(save, region.id);
              return (
                <li key={region.id} className="flex justify-between rounded-lg bg-secondary/30 px-3 py-2 text-sm">
                  <span>{region.name}</span>
                  <span className="text-muted-foreground">
                    {isRegionUnlocked(player.xp, region.id) ? `${rp.done}/${rp.total}` : "Selado"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="quest-panel mt-5 rounded-xl p-5">
          <h2 className="font-display text-xl text-parchment">Troféus e conquistas</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = save.progress.achievements.includes(achievement.id);
              return (
                <li
                  key={achievement.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    unlocked ? "border-primary/50 bg-primary/10" : "border-border bg-secondary/20 opacity-70"
                  }`}
                >
                  <p className={unlocked ? "text-parchment" : "text-muted-foreground"}>
                    {unlocked ? "★" : "☆"} {achievement.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="quest-panel mt-5 rounded-xl p-5">
          <h2 className="font-display text-xl text-parchment">Arquétipo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A troca de arquétipo é permitida uma vez a cada seis meses e não altera seu progresso.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CLASSES.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={!canSwap || option.id === player.classId}
                onClick={() => changeClass(option.id)}
                className="rounded-md border border-border px-4 py-2 text-sm disabled:opacity-50 enabled:hover:border-primary/60"
              >
                {option.glyph} {option.name}
              </button>
            ))}
          </div>
          {!canSwap && (
            <p className="mt-2 text-xs text-muted-foreground">
              Você trocou de arquétipo recentemente. A próxima troca abre após seis meses.
            </p>
          )}
        </section>
      </main>
    </Shell>
  );
}
