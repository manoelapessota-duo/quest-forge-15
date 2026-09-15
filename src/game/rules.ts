import { AXES, LEVELS, MATERIALS, QUESTIONS, REGIONS, getQuestionsForMaterial } from "./data";
import type { AnswerRecord, AxisId, GameSave, Question, RegionId } from "./types";

export const RETRY_COOLDOWN_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

export function calculateLevelFromXP(xp: number): number {
  let level = 1;
  for (const entry of LEVELS) if (xp >= entry.xp) level = entry.level;
  return level;
}

export function getLevelTitle(level: number): string {
  return LEVELS.find((l) => l.level === level)?.title ?? "Aprendiz do Vale";
}

export function getXPForNextLevel(xp: number): { current: number; next: number | null } {
  const level = calculateLevelFromXP(xp);
  const current = LEVELS.find((l) => l.level === level)!.xp;
  const next = LEVELS.find((l) => l.level === level + 1)?.xp ?? null;
  return { current, next };
}

export function getLevelProgress(xp: number): number {
  const { current, next } = getXPForNextLevel(xp);
  if (next === null) return 100;
  return Math.min(100, Math.round(((xp - current) / (next - current)) * 100));
}

export function getUnlockedRegions(xp: number): RegionId[] {
  const level = calculateLevelFromXP(xp);
  return REGIONS.filter((r) => level >= r.unlockLevel).map((r) => r.id);
}

export function isRegionUnlocked(xp: number, region: RegionId): boolean {
  return getUnlockedRegions(xp).includes(region);
}

/** Embaralhamento estável a partir de uma semente textual. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return Math.abs(h % 1000000) / 1000000;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i]!, out[j]!] = [out[j]!, out[i]!];
  }
  return out;
}

export interface ShuffledQuestion extends Question {
  displayOptions: { text: string; originalIndex: number }[];
}

export function shuffleQuestion(question: Question, seed: string): ShuffledQuestion {
  const indexed = question.options.map((text, originalIndex) => ({ text, originalIndex }));
  const displayOptions =
    question.type === "true_false" ? indexed : seededShuffle(indexed, seed + question.id);
  return { ...question, displayOptions };
}

export function answersFor(save: GameSave, questionId: string): AnswerRecord[] {
  return save.answers.filter((a) => a.questionId === questionId);
}

/** Uma pergunta acertada sai do baralho; errada volta após 7 dias valendo metade do XP. */
export function questionAvailability(
  save: GameSave,
  question: Question,
  now = Date.now(),
): { available: boolean; xp: number; attempt: number } {
  const records = answersFor(save, question.id);
  if (records.length === 0) return { available: true, xp: question.xp, attempt: 1 };
  const solved = records.some((r) => r.correct);
  const last = records[records.length - 1]!;
  if (solved) return { available: false, xp: 0, attempt: records.length + 1 };
  const ready = now - last.at >= RETRY_COOLDOWN_DAYS * DAY;
  return {
    available: ready,
    xp: Math.floor(question.xp / 2),
    attempt: records.length + 1,
  };
}

export function isQuestCompleted(save: GameSave, materialId: string): boolean {
  return save.progress.completedQuests.includes(materialId);
}

export function getQuestProgress(save: GameSave, materialId: string): { done: number; total: number } {
  const questions = getQuestionsForMaterial(materialId);
  const done = questions.filter((q) => answersFor(save, q.id).length > 0).length;
  return { done, total: questions.length };
}

export function getRegionProgress(save: GameSave, region: RegionId): { done: number; total: number } {
  const materials = MATERIALS.filter((m) => m.region === region);
  return {
    done: materials.filter((m) => isQuestCompleted(save, m.id)).length,
    total: materials.length,
  };
}

export type QuestStatus = "locked" | "available" | "in_progress" | "completed";

export function getQuestStatus(save: GameSave, materialId: string): QuestStatus {
  const material = MATERIALS.find((m) => m.id === materialId);
  if (!material) return "locked";
  const xp = save.player?.xp ?? 0;
  if (!isRegionUnlocked(xp, material.region)) return "locked";
  if (isQuestCompleted(save, materialId)) return "completed";
  const { done } = getQuestProgress(save, materialId);
  return done > 0 ? "in_progress" : "available";
}

export function getAvailableQuests(save: GameSave): string[] {
  return MATERIALS.filter((m) => {
    const status = getQuestStatus(save, m.id);
    return status === "available" || status === "in_progress";
  }).map((m) => m.id);
}

export interface AxisStat {
  axis: AxisId;
  name: string;
  asked: number;
  correct: number;
  total: number;
  accuracy: number;
  coverage: number;
}

export function getAxisStats(save: GameSave): AxisStat[] {
  return AXES.map((axis) => {
    const pool = QUESTIONS.filter((q) => q.axis === axis.id);
    const records = save.answers.filter((a) => a.axis === axis.id);
    const uniqueAsked = new Set(records.map((r) => r.questionId)).size;
    const correct = new Set(records.filter((r) => r.correct).map((r) => r.questionId)).size;
    return {
      axis: axis.id,
      name: axis.name,
      asked: uniqueAsked,
      correct,
      total: pool.length,
      accuracy: records.length ? Math.round((records.filter((r) => r.correct).length / records.length) * 100) : 0,
      coverage: pool.length ? Math.round((uniqueAsked / pool.length) * 100) : 0,
    };
  }).filter((s) => s.total > 0);
}

/** Amostra balanceada por eixo, região, formato e dificuldade. */
export function buildDiagnostic(seed: string, size = 12): Question[] {
  const picked: Question[] = [];
  const axes = seededShuffle(AXES.map((a) => a.id), seed);
  const difficulties = ["light", "medium", "advanced", "challenge"] as const;
  let d = 0;
  for (const axis of axes) {
    if (picked.length >= size) break;
    const difficulty = difficulties[d % difficulties.length]!;
    d++;
    const pool = QUESTIONS.filter(
      (q) => q.axis === axis && !picked.some((p) => p.id === q.id) && q.difficulty === difficulty,
    );
    const fallback = QUESTIONS.filter((q) => q.axis === axis && !picked.some((p) => p.id === q.id));
    const source = pool.length ? pool : fallback;
    const chosen = seededShuffle(source, seed + axis)[0];
    if (chosen) picked.push(chosen);
  }
  let i = 0;
  while (picked.length < size && i < QUESTIONS.length) {
    const candidate = seededShuffle(QUESTIONS, seed + "fill")[i++];
    if (candidate && !picked.some((p) => p.id === candidate.id)) picked.push(candidate);
  }
  return picked.slice(0, size);
}

/** Composição oficial do Chefão Semanal: 2 leves, 3 médias, 3 avançadas, 2 desafio. */
export function buildWeeklyBoss(seed: string): Question[] {
  const composition: Record<string, number> = { light: 2, medium: 3, advanced: 3, challenge: 2 };
  const out: Question[] = [];
  for (const [difficulty, count] of Object.entries(composition)) {
    const pool = seededShuffle(
      QUESTIONS.filter((q) => q.difficulty === difficulty),
      seed + difficulty,
    );
    out.push(...pool.slice(0, count));
  }
  return out;
}

export function getWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / DAY + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function canPlayWeeklyBoss(save: GameSave, now = new Date()): boolean {
  return !save.weeklyBoss.some((run) => run.weekKey === getWeekKey(now));
}

export function canChangeClass(save: GameSave, now = Date.now()): boolean {
  if (!save.player) return false;
  // Quem acabou de criar o personagem ainda não gastou a troca do semestre.
  if (save.player.classChangedAt === save.player.createdAt) return true;
  return now - save.player.classChangedAt >= 182 * DAY;
}

export function evaluateAchievements(save: GameSave): string[] {
  const unlocked = new Set(save.progress.achievements);
  const xp = save.player?.xp ?? 0;
  const completed = save.progress.completedQuests.length;
  if (completed >= 1) unlocked.add("first-steps");
  if (completed >= 10) unlocked.add("explorer");
  if (save.progress.diagnostic) unlocked.add("diagnostic");
  if (save.progress.masteredQuests.length >= 1) unlocked.add("mastery");
  if (isRegionUnlocked(xp, "floresta")) unlocked.add("vertha");
  if (isRegionUnlocked(xp, "planalto")) unlocked.add("planalto");
  if (isRegionUnlocked(xp, "cume")) unlocked.add("cume");
  if (save.weeklyBoss.some((r) => r.trophy)) unlocked.add("boss");
  if (calculateLevelFromXP(xp) >= 20) unlocked.add("legend");
  return [...unlocked];
}

/** Vitalidade do personagem: cada resposta errada tira 4 pontos, com piso de 20. */
export function getVitality(save: GameSave): {
  hp: number;
  maxHp: number;
  wounds: number;
  healed: number;
} {
  const wounds = save.answers.filter((a) => !a.correct).length;
  const healed = save.answers.filter((a) => a.correct && a.attempt > 1).length;
  const hp = Math.max(20, 100 - wounds * 4 + healed * 2);
  return { hp: Math.min(100, hp), maxHp: 100, wounds, healed };
}

/** Progresso da mochila: materiais marcados como vistos/lidos. */
export function getBackpackProgress(save: GameSave): { done: number; total: number } {
  return { done: save.progress.seenMaterials.length, total: MATERIALS.length };
}

export function getTopMistakes(save: GameSave, limit = 10) {
  const counts = new Map<string, { questionId: string; misses: number }>();
  for (const record of save.answers) {
    if (record.correct) continue;
    const entry = counts.get(record.questionId) ?? { questionId: record.questionId, misses: 0 };
    entry.misses += 1;
    counts.set(record.questionId, entry);
  }
  return [...counts.values()].sort((a, b) => b.misses - a.misses).slice(0, limit);
}
