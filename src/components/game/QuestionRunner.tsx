import { useMemo, useState } from "react";
import { DIFFICULTY_LABEL, TYPE_LABEL, axisName, getMaterial } from "@/game/data";
import { shuffleQuestion } from "@/game/rules";
import type { Question } from "@/game/types";

export interface RunnerResult {
  correct: number;
  total: number;
  xp: number;
}

export function QuestionRunner({
  questions,
  seed,
  onAnswer,
  onFinish,
  finishLabel = "Concluir",
}: {
  questions: Question[];
  seed: string;
  onAnswer: (question: Question, originalIndex: number) => { correct: boolean; xpAwarded: number };
  onFinish: (result: RunnerResult) => void;
  finishLabel?: string;
}) {
  const deck = useMemo(() => questions.map((q) => shuffleQuestion(q, seed)), [questions, seed]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; xpAwarded: number } | null>(null);
  const [score, setScore] = useState({ correct: 0, xp: 0 });

  const question = deck[index];
  if (!question) return null;

  const last = index === deck.length - 1;

  function choose(originalIndex: number) {
    if (feedback) return;
    setPicked(originalIndex);
    const outcome = onAnswer(question!, originalIndex);
    setFeedback(outcome);
    setScore((s) => ({
      correct: s.correct + (outcome.correct ? 1 : 0),
      xp: s.xp + outcome.xpAwarded,
    }));
  }

  function advance() {
    const total = deck.length;
    if (last) {
      onFinish({ correct: score.correct, total, xp: score.xp });
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    setFeedback(null);
  }

  return (
    <div className="quest-panel rounded-xl p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-secondary px-2.5 py-1">
          Pergunta {index + 1} de {deck.length}
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-1">{TYPE_LABEL[question.type]}</span>
        <span className="rounded-full bg-secondary px-2.5 py-1">
          {DIFFICULTY_LABEL[question.difficulty]} · {question.xp} XP
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-1">{axisName(question.axis)}</span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-[width] duration-300"
          style={{ width: `${((index + (feedback ? 1 : 0)) / deck.length) * 100}%` }}
        />
      </div>

      <h2 className="mt-5 font-display text-xl leading-snug text-parchment sm:text-2xl">
        {question.prompt}
      </h2>

      <MaterialReference materialId={question.materialId} />

      <ul className="mt-5 space-y-2">
        {question.displayOptions.map((option) => {
          const isPicked = picked === option.originalIndex;
          const isAnswer = option.originalIndex === question.answerIndex;
          const state = !feedback
            ? "border-border bg-secondary/40 hover:border-primary/60 hover:bg-secondary"
            : isAnswer
              ? "border-success bg-success/15"
              : isPicked
                ? "border-destructive bg-destructive/15"
                : "border-border bg-secondary/20 opacity-70";
          return (
            <li key={option.originalIndex}>
              <button
                type="button"
                onClick={() => choose(option.originalIndex)}
                disabled={!!feedback}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${state}`}
              >
                {option.text}
              </button>
            </li>
          );
        })}
      </ul>

      {feedback && (
        <div className="mt-5 rounded-lg border border-border bg-background/50 p-4">
          <p className={`font-display text-lg ${feedback.correct ? "text-success" : "text-primary"}`}>
            {feedback.correct ? `Acerto! +${feedback.xpAwarded} XP` : "Ainda não"}
          </p>
          {!feedback.correct && (
            <p className="mt-1 text-sm text-muted-foreground">
              Resposta correta: <span className="text-foreground">{question.answerText}</span>
            </p>
          )}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{question.explanation}</p>
          <button
            type="button"
            onClick={advance}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {last ? finishLabel : "Próxima"}
          </button>
        </div>
      )}
    </div>
  );
}

/** Referência do material de origem, presente em toda pergunta do PDI. */
function MaterialReference({ materialId }: { materialId: string }) {
  const material = materialId ? getMaterial(materialId) : undefined;
  if (!material) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        Pergunta geral de ofício — não pertence a nenhum material do PDI. Serve para situar seu ponto de
        partida na jornada.
      </p>
    );
  }
  return (
    <div className="mt-3 rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
      <span className="text-primary">Material de referência:</span>{" "}
      <span className="text-foreground">{material.name}</span> · {material.source} · {material.kind} ·{" "}
      {material.duration}
      {material.url && (
        <>
          {" · "}
          <a href={material.url} target="_blank" rel="noreferrer" className="text-primary underline">
            abrir material
          </a>
        </>
      )}
    </div>
  );
}
