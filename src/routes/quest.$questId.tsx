import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/game/Shell";
import { QuestionRunner, type RunnerResult } from "@/components/game/QuestionRunner";
import { axisName, getMaterial, getQuestionsForMaterial, regionName } from "@/game/data";
import { getLevelTitle, getQuestProgress, getQuestStatus, questionAvailability } from "@/game/rules";
import { useGame } from "@/game/state";

export const Route = createFileRoute("/quest/$questId")({
  head: () => ({
    meta: [
      { title: "Missão — PDI QUEST" },
      { name: "description", content: "Enfrente os dez desafios da missão e conquiste XP no mundo do PDI QUEST." },
      { property: "og:title", content: "Missão — PDI QUEST" },
      { property: "og:description", content: "Dez desafios, feedback imediato e selo de domínio." },
    ],
  }),
  component: QuestScreen,
});

function QuestScreen() {
  const { questId } = Route.useParams();
  const { save, recordAnswer, completeQuest, level } = useGame();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<RunnerResult | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);

  const material = getMaterial(questId);
  const questions = useMemo(() => getQuestionsForMaterial(questId), [questId]);
  const pending = useMemo(
    () => questions.filter((q) => questionAvailability(save, q).available),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions, started],
  );

  if (!material) {
    return (
      <Shell>
        <main className="mx-auto max-w-2xl px-5 py-16">
          <h1 className="font-display text-2xl text-parchment">Missão não encontrada</h1>
          <Link to="/world" className="mt-4 inline-block rounded-md bg-primary px-5 py-2.5 text-primary-foreground">
            Voltar ao mapa
          </Link>
        </main>
      </Shell>
    );
  }

  const status = getQuestStatus(save, questId);
  const progress = getQuestProgress(save, questId);

  if (result) {
    const mastered = save.progress.masteredQuests.includes(questId);
    return (
      <Shell>
        <main className="mx-auto max-w-2xl px-5 py-14 text-center">
          <p className="text-xs tracking-[0.3em] text-primary uppercase">Missão encerrada</p>
          <h1 className="mt-3 font-display text-3xl text-parchment">{material.name}</h1>
          <p className="mt-4 text-lg text-foreground">
            {result.correct} de {result.total} acertos · <span className="text-primary">+{result.xp} XP</span>
          </p>
          {mastered && (
            <p className="mt-3 font-display text-lg text-success">Selo de Domínio conquistado</p>
          )}
          {levelUp && (
            <div className="quest-panel mt-6 rounded-xl p-5">
              <p className="font-display text-2xl text-primary">Nível {levelUp}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Você agora é {getLevelTitle(levelUp)}. Novos caminhos podem ter se aberto no mapa.
              </p>
            </div>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/world" className="rounded-md bg-primary px-5 py-2.5 text-primary-foreground">
              Voltar ao mapa
            </Link>
            <Link to="/profile" className="rounded-md border border-border px-5 py-2.5">
              Ver personagem
            </Link>
          </div>
        </main>
      </Shell>
    );
  }

  if (started && pending.length > 0) {
    return (
      <Shell>
        <main className="mx-auto max-w-2xl px-5 py-8">
          <h1 className="mb-4 font-display text-xl text-parchment">{material.name}</h1>
          <QuestionRunner
            questions={pending}
            seed={material.id}
            finishLabel="Encerrar missão"
            onAnswer={(question, index) => {
              const outcome = recordAnswer(question, index, "quest");
              if (outcome.leveledUp) setLevelUp(outcome.newLevel);
              return outcome;
            }}
            onFinish={(runResult) => {
              completeQuest(questId);
              setResult(runResult);
            }}
          />
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      <main className="mx-auto max-w-2xl px-5 py-12">
        <p className="text-xs tracking-[0.3em] text-primary uppercase">
          {regionName(material.region)} · {axisName(material.axis)}
        </p>
        <h1 className="mt-3 font-display text-3xl text-parchment">{material.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {material.kind} · {material.source} · {material.duration} · {material.access}
        </p>

        <div className="quest-panel mt-6 rounded-xl p-5">
          <h2 className="font-display text-lg text-parchment">Objetivo</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{material.objective}</p>
          {material.scope && (
            <>
              <h2 className="mt-4 font-display text-lg text-parchment">O que você percorre</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{material.scope}</p>
            </>
          )}
          {material.url && (
            <a
              href={material.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline"
            >
              Abrir o material de estudo
            </a>
          )}
        </div>

        <p className="mt-5 text-sm text-muted-foreground">
          {progress.done}/{progress.total} desafios enfrentados · {material.totalXP} XP no total ·{" "}
          {pending.length} disponíveis agora
        </p>

        {pending.length === 0 ? (
          <div className="quest-panel mt-5 rounded-xl p-5 text-sm text-muted-foreground">
            {status === "completed"
              ? "Missão concluída. Os desafios errados retornam após sete dias valendo metade do XP."
              : "Nenhum desafio disponível agora. Volte em alguns dias para revisar o que ficou pendente."}
            <div className="mt-4">
              <Link to="/world" className="rounded-md bg-primary px-5 py-2.5 text-primary-foreground">
                Voltar ao mapa
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="rounded-md bg-primary px-6 py-3 font-display text-lg text-primary-foreground transition-opacity hover:opacity-90"
            >
              Enfrentar desafios
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/world" })}
              className="rounded-md border border-border px-6 py-3"
            >
              Voltar ao mapa
            </button>
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground">Nível atual: {level}</p>
      </main>
    </Shell>
  );
}
