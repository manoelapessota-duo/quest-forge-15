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
import {
  clearLocalCache,
  emptySave,
  getSaveOwner,
  loadSave,
  persistSave,
  setSaveOwner,
} from "./storage";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { isEmptySave, loadCloudSave, logActivity, saveCloudSave, saveWeight } from "./cloud";
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
  saving: boolean;
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
  const { user, loading: authLoading } = useAuth();
  const [save, setSave] = useState<GameSave>(emptySave);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveRef = useRef(save);
  saveRef.current = save;
  const userIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hidratação: nuvem é a fonte oficial; o cache local só é promovido quando
  // a nuvem está vazia e o save pertence a este mesmo usuário.
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setHydrated(false);

    const run = async () => {
      if (!user) {
        userIdRef.current = null;
        if (active) {
          setSave(loadSave());
          setHydrated(true);
        }
        return;
      }
      const owner = getSaveOwner();
      const local = owner === null || owner === user.id ? loadSave() : emptySave;
      const cloud = await loadCloudSave(user.id);
      let chosen = cloud ?? emptySave;

      if (!isEmptySave(local) && saveWeight(local) > saveWeight(chosen)) {
        chosen = local;
        await saveCloudSave(user.id, local);
        await logActivity(user.id, "progress_migrated", "Progresso deste navegador enviado para a nuvem");
      } else if (!cloud) {
        await saveCloudSave(user.id, chosen);
      }

      if (!active) return;
      userIdRef.current = user.id;
      setSaveOwner(user.id);
      setSave(chosen);
      persistSave(chosen);
      setHydrated(true);
    };

    void run();
    return () => {
      active = false;
    };
  }, [user, authLoading]);

  // Autosave com debounce: cache local imediato, nuvem depois de uma pausa.
  useEffect(() => {
    if (!hydrated) return;
    persistSave(save);
    const userId = userIdRef.current;
    if (!userId) return;
    setSaving(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void saveCloudSave(userId, saveRef.current).finally(() => setSaving(false));
    }, 1200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [save, hydrated]);

  // Salvamento final ao sair do jogo.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const flush = () => {
      const userId = userIdRef.current;
      if (userId && hydrated) void saveCloudSave(userId, saveRef.current);
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [hydrated]);

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

      const userId = userIdRef.current;
      if (userId && afterLevel > beforeLevel) {
        void logActivity(userId, "level_up", `Alcançou o nível ${afterLevel}`, { level: afterLevel });
      }

      return { correct, xpAwarded, leveledUp: afterLevel > beforeLevel, newLevel: afterLevel };
    },
    [update],
  );

  const completeQuest = useCallback(
    (materialId: string) => {
      const userId = userIdRef.current;
      if (userId && !saveRef.current.progress.completedQuests.includes(materialId)) {
        void logActivity(userId, "quest_completed", "Concluiu uma missão", { materialId });
      }
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
    const userId = userIdRef.current;
    clearLocalCache();
    setSave(emptySave);
    if (userId) {
      void (async () => {
        await supabase.from("game_progress").delete().eq("user_id", userId);
        await logActivity(userId, "progress_reset", "Jogador reiniciou o próprio progresso");
        setSaveOwner(userId);
      })();
    }
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      save,
      hydrated,
      saving,
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
      saving,
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
