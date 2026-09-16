import { supabase } from "@/integrations/supabase/client";
import { calculateLevelFromXP, getUnlockedRegions, getXPForNextLevel } from "./rules";
import { emptySave, SAVE_VERSION } from "./storage";
import type { GameSave } from "./types";

export type ActivityEvent =
  | "login"
  | "account_created"
  | "quest_completed"
  | "level_up"
  | "achievement"
  | "region_unlocked"
  | "diagnostic_completed"
  | "weekly_boss"
  | "progress_migrated"
  | "progress_reset"
  | "admin_reset"
  | "admin_edit"
  | "admin_status";

/** Normaliza um save carregado da nuvem (defaults para campos ausentes). */
function normalizeSave(raw: unknown): GameSave {
  const value = (raw ?? {}) as Partial<GameSave>;
  const save: GameSave = {
    player: value.player ?? null,
    progress: { ...emptySave.progress, ...(value.progress ?? {}) },
    answers: Array.isArray(value.answers) ? value.answers : [],
    weeklyBoss: Array.isArray(value.weeklyBoss) ? value.weeklyBoss : [],
    settings: { ...emptySave.settings, ...(value.settings ?? {}) },
  };
  if (save.player) {
    if (typeof save.player.xp !== "number") save.player.xp = 0;
    if (!save.player.avatar) save.player.avatar = "mistico";
  }
  if (!Array.isArray(save.progress.seenMaterials)) save.progress.seenMaterials = [];
  return save;
}

/** Quantidade de sinais de progresso — usada para nunca sobrescrever um save maior. */
export function saveWeight(save: GameSave): number {
  return (
    (save.player ? 1 : 0) +
    (save.player?.xp ?? 0) +
    save.answers.length +
    save.progress.completedQuests.length +
    save.progress.seenMaterials.length +
    (save.progress.diagnostic ? 1 : 0)
  );
}

export function isEmptySave(save: GameSave): boolean {
  return saveWeight(save) === 0;
}

export async function ensureProfile(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const meta = user.user_metadata ?? {};
  const payload = {
    id: user.id,
    email: user.email ?? null,
    full_name: (meta["full_name"] as string) ?? (meta["name"] as string) ?? null,
    avatar_url: (meta["avatar_url"] as string) ?? (meta["picture"] as string) ?? null,
    last_seen_at: new Date().toISOString(),
  };
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("profiles").insert(payload);
    await logActivity(user.id, "account_created", "Conta criada no PDI QUEST");
  } else {
    await supabase.from("profiles").update(payload).eq("id", user.id);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, status, created_at, last_seen_at")
    .eq("id", user.id)
    .maybeSingle();
  return profile ?? null;
}

export async function loadCloudSave(userId: string): Promise<GameSave | null> {
  const { data, error } = await supabase
    .from("game_progress")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return normalizeSave(data.state);
}

export async function saveCloudSave(userId: string, save: GameSave) {
  const xp = save.player?.xp ?? 0;
  const level = calculateLevelFromXP(xp);
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    level,
    xp,
    xp_to_next: getXPForNextLevel(xp).next,
    character_name: save.player?.name ?? null,
    class_id: save.player?.classId ?? null,
    avatar: save.player?.avatar ?? null,
    attributes: { prologueSeen: save.progress.prologueSeen },
    backpack: save.progress.seenMaterials,
    completed_quests: save.progress.completedQuests,
    mastered_quests: save.progress.masteredQuests,
    achievements: save.progress.achievements,
    unlocked_regions: getUnlockedRegions(xp),
    diagnostic: save.progress.diagnostic,
    answers: save.answers,
    weekly_boss: save.weeklyBoss,
    settings: save.settings,
    checkpoint: {
      lastAnswerAt: save.answers.at(-1)?.at ?? null,
      lastQuest: save.progress.completedQuests.at(-1) ?? null,
    },
    state: save,
    save_version: SAVE_VERSION,
    last_saved_at: now,
    last_activity_at: now,
  };
  const { error } = await supabase.from("game_progress").upsert(row as never, { onConflict: "user_id" });
  return !error;
}

export async function logActivity(
  userId: string,
  eventType: ActivityEvent,
  description: string,
  metadata: Record<string, unknown> = {},
) {
  const { data } = await supabase.auth.getUser();
  const actorId = data.user?.id;
  if (!actorId) return;
  await supabase
    .from("activity_log")
    .insert({ user_id: userId, actor_id: actorId, event_type: eventType, description, metadata } as never);
}
