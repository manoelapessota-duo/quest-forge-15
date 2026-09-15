import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getQuestionsForMaterial } from "./data";
import {
  calculateLevelFromXP,
  evaluateAchievements,
  getWeekKey,
  questionAvailability,
} from "./rules";
import { clearSave, emptySave, loadSave, persistSave } from "./storage";
import type {
  AnswerRecord,
  AvatarId,
  ClassId,
  DiagnosticResult,
  GameSave,
  Question,
} from "./types";

interface AnswerOutcome {
  correct: boolean;
  xpAwarded: number;
  leveledUp: boolean;
  newLevel: number;
}

interface GameContextValue {
  save: GameSave;
  hydrated: boolean;
  level: number;
  createPlayer: (name: string, classId: ClassId, avatar: AvatarId) => void;
  changeClass: (classId: ClassId) => void;
  changeAvatar: (avatar: AvatarId) => void;
  toggleMaterialSeen: (materialId: string) => void;
  markPrologueSeen: () => void;
  recordAnswer: (
    question: Question,
    chosenIndex: number,
    context: AnswerRecord["context"],
  ) => AnswerOutcome;
  completeQuest: (materialId: string) => void;
  saveDiagnostic: (result: DiagnosticResult) => void;
  recordBossRun: (correct: number, total: number, xp: number, trophy: boolean) => void;
  updateSettings: (patch: Partial<GameSave["settings"]>) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<GameSave>(emptySave);
  const [hydrated, setHydrated] = useState(false);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    setSave(loadSave());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persistSave(save);
  }, [save, hydrated]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("reduce-motion", !save.settings.animations);
  }, [save.settings.animations]);

  const update = useCallback((fn: (previous: GameSave) => GameSave) => {
    setSave((previous) => {
      const next = fn(previous);
      return { ...next, progress: { ...next.progress, achievements: evaluateAchievements(next) } };
    });
  }, []);

  const createPlayer = useCallback(
    (name: string, classId: ClassId, avatar: AvatarId) => {
      const now = Date.now();
      update((previous) => ({
        ...previous,
        player: {
          name: name.trim().slice(0, 40),
          classId,
          avatar,
          createdAt: now,
          classChangedAt: now,
          xp: 0,
        },
      }));
    },
    [update],
  );

  const changeClass = useCallback(
    (classId: ClassId) => {
      update((previous) =>
        previous.player
          ? { ...previous, player: { ...previous.player, classId, classChangedAt: Date.now() } }
          : previous,
      );
    },
    [update],
  );

  const changeAvatar = useCallback(
    (avatar: AvatarId) => {
      update((previous) =>
        previous.player ? { ...previous, player: { ...previous.player, avatar } } : previous,
      );
    },
    [update],
  );

  const toggleMaterialSeen = useCallback(
    (materialId: string) => {
      update((previous) => {
        const seen = previous.progress.seenMaterials.includes(materialId);
        return {
          ...previous,
          progress: {
            ...previous.progress,
            seenMaterials: seen
              ? previous.progress.seenMaterials.filter((id) => id !== materialId)
              : [...previous.progress.seenMaterials, materialId],
          },
        };
      });
    },
    [update],
  );

  const markPrologueSeen = useCallback(() => {
    update((previous) => ({ ...previous, progress: { ...previous.progress, prologueSeen: true } }));
  }, [update]);

  const recordAnswer = useCallback<GameContextValue["recordAnswer"]>(
    (question, chosenIndex, context) => {
      const current = saveRef.current;
      const correct = chosenIndex === question.answerIndex;
      const availability = questionAvailability(current, question);
      const xpAwarded = correct && availability.available ? availability.xp : 0;
      const beforeLevel = calculateLevelFromXP(current.player?.xp ?? 0);
      const afterXP = (current.player?.xp ?? 0) + Math.max(0, xpAwarded);
      const afterLevel = calculateLevelFromXP(afterXP);

      const record: AnswerRecord = {
        questionId: question.id,
        materialId: question.materialId,
        region: question.region,
        axis: question.axis,
        difficulty: question.difficulty,
        correct,
        xpAwarded,
        attempt: availability.attempt,
        at: Date.now(),
        context,
      };

      update((previous) => ({
        ...previous,
        answers: [...previous.answers, record],
        player: previous.player ? { ...previous.player, xp: previous.player.xp + Math.max(0, xpAwarded) } : previous.player,
      }));

      return { correct, xpAwarded, leveledUp: afterLevel > beforeLevel, newLevel: afterLevel };
    },
    [update],
  );

  const completeQuest = useCallback(
    (materialId: string) => {
      update((previous) => {
        if (previous.progress.completedQuests.includes(materialId)) return previous;
        const questions = getQuestionsForMaterial(materialId);
        const firstTryCorrect = questions.filter((q) =>
          previous.answers.some((a) => a.questionId === q.id && a.attempt === 1 && a.correct),
        ).length;
        const mastered = firstTryCorrect >= 8;
        return {
          ...previous,
          progress: {
            ...previous.progress,
            completedQuests: [...previous.progress.completedQuests, materialId],
            masteredQuests: mastered
              ? [...new Set([...previous.progress.masteredQuests, materialId])]
              : previous.progress.masteredQuests,
          },
        };
      });
    },
    [update],
  );

  const saveDiagnostic = useCallback(
    (result: DiagnosticResult) => {
      update((previous) => ({
        ...previous,
        progress: { ...previous.progress, diagnostic: result },
      }));
    },
    [update],
  );

  const recordBossRun = useCallback(
    (correct: number, total: number, xp: number, trophy: boolean) => {
      update((previous) => {
        const weekKey = getWeekKey();
        if (previous.weeklyBoss.some((r) => r.weekKey === weekKey)) return previous;
        return {
          ...previous,
          weeklyBoss: [...previous.weeklyBoss, { weekKey, at: Date.now(), correct, total, xp, trophy }],
        };
      });
    },
    [update],
  );

  const updateSettings = useCallback(
    (patch: Partial<GameSave["settings"]>) => {
      update((previous) => ({ ...previous, settings: { ...previous.settings, ...patch } }));
    },
    [update],
  );

  const resetGame = useCallback(() => {
    clearSave();
    setSave(emptySave);
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      save,
      hydrated,
      level: calculateLevelFromXP(save.player?.xp ?? 0),
      createPlayer,
      changeClass,
      changeAvatar,
      toggleMaterialSeen,
      markPrologueSeen,
      recordAnswer,
      completeQuest,
      saveDiagnostic,
      recordBossRun,
      updateSettings,
      resetGame,
    }),
    [
      save,
      hydrated,
      createPlayer,
      changeClass,
      changeAvatar,
      toggleMaterialSeen,
      markPrologueSeen,
      recordAnswer,
      completeQuest,
      saveDiagnostic,
      recordBossRun,
      updateSettings,
      resetGame,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame precisa estar dentro de GameProvider");
  return context;
}
