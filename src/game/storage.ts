import type { GameSave } from "./types";

const KEYS = {
  player: "pdiQuest.player",
  progress: "pdiQuest.progress",
  answers: "pdiQuest.answers",
  weeklyBoss: "pdiQuest.weeklyBoss",
  settings: "pdiQuest.settings",
  version: "pdiQuest.version",
} as const;

export const SAVE_VERSION = 1;

export const emptySave: GameSave = {
  player: null,
  progress: {
    completedQuests: [],
    masteredQuests: [],
    prologueSeen: false,
    diagnostic: null,
    achievements: [],
    seenMaterials: [],
  },
  answers: [],
  weeklyBoss: [],
  settings: { sound: false, animations: true },
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadSave(): GameSave {
  if (typeof window === "undefined") return emptySave;
  const save: GameSave = {
    player: read(KEYS.player, emptySave.player),
    progress: { ...emptySave.progress, ...read(KEYS.progress, emptySave.progress) },
    answers: read(KEYS.answers, emptySave.answers),
    weeklyBoss: read(KEYS.weeklyBoss, emptySave.weeklyBoss),
    settings: { ...emptySave.settings, ...read(KEYS.settings, emptySave.settings) },
  };
  if (save.player && typeof save.player.xp !== "number") save.player.xp = 0;
  if (!Array.isArray(save.answers)) save.answers = [];
  if (!Array.isArray(save.progress.seenMaterials)) save.progress.seenMaterials = [];
  if (save.player && !save.player.avatar) save.player.avatar = "mistico";
  return save;
}

export function persistSave(save: GameSave) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEYS.version, String(SAVE_VERSION));
    localStorage.setItem(KEYS.player, JSON.stringify(save.player));
    localStorage.setItem(KEYS.progress, JSON.stringify(save.progress));
    localStorage.setItem(KEYS.answers, JSON.stringify(save.answers));
    localStorage.setItem(KEYS.weeklyBoss, JSON.stringify(save.weeklyBoss));
    localStorage.setItem(KEYS.settings, JSON.stringify(save.settings));
  } catch {
    /* armazenamento indisponível: o jogo continua apenas em memória */
  }
}

export function clearSave() {
  if (typeof window === "undefined") return;
  for (const key of Object.values(KEYS)) localStorage.removeItem(key);
}

const OWNER_KEY = "pdiQuest.owner";

/** Dono do save guardado neste navegador (id do usuário autenticado). */
export function getSaveOwner(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

export function setSaveOwner(userId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OWNER_KEY, userId);
  } catch {
    /* armazenamento indisponível */
  }
}

export function clearLocalCache() {
  clearSave();
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(OWNER_KEY);
  } catch {
    /* armazenamento indisponível */
  }
}
