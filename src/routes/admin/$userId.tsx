import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/game/Shell";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/game/cloud";
import { MATERIALS } from "@/game/data";

export const Route = createFileRoute("/admin/$userId")({
  head: () => ({
    meta: [
      { title: "Ficha do jogador — PDI QUEST" },
      { name: "description", content: "Progresso detalhado e ações administrativas de um jogador do PDI QUEST." },
      { property: "og:title", content: "Ficha do jogador — PDI QUEST" },
      { property: "og:description", content: "Nível, XP, missões, conquistas e histórico do jogador." },
    ],
  }),
  component: AdminPlayerScreen,
});

function AdminPlayerScreen() {
  const { userId } = Route.useParams();
  const { isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<"reset" | "disable" | null>(null);
  const [name, setName] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user", userId],
    enabled: isAdmin,
    queryFn: async () => {
      const [profile, progress, activity] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("game_progress").select("*").eq("user_id", userId).maybeSingle(),
        supabase
          .from("activity_log")
          .select("id, event_type, description, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(25),
      ]);
      return { profile: profile.data, progress: progress.data, activity: activity.data ?? [] };
    },
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });

  const resetProgress = useMutation({
    mutationFn: async () => {
      await supabase.from("game_progress").delete().eq("user_id", userId);
      await logActivity(userId, "admin_reset", "Progresso reiniciado por um administrador");
    },
    onSuccess: () => {
      setConfirm(null);
      refresh();
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async (next: string) => {
      await supabase.from("profiles").update({ status: next }).eq("id", userId);
      await logActivity(userId, "admin_status", `Conta marcada como ${next === "active" ? "ativa" : "desativada"}`);
    },
    onSuccess: () => {
      setConfirm(null);
      refresh();
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const saveName = useMutation({
    mutationFn: async (value: string) => {
      await supabase.from("profiles").update({ full_name: value }).eq("id", userId);
      await logActivity(userId, "admin_edit", `Nome ajustado para "${value}" por um administrador`);
    },
    onSuccess: () => {
      setName(null);
      refresh();
    },
  });

  if (loading || isLoading) {
    return <Shell><main className="mx-auto max-w-3xl px-5 py-16 text-sm text-muted-foreground">Carregando ficha…</main></Shell>;
  }

  if (!isAdmin) {
    return (
      <Shell>
        <main className="mx-auto max-w-lg px-5 py-20 text-center">
          <h1 className="font-display text-2xl text-parchment">Portão selado</h1>
          <p className="mt-3 text-sm text-muted-foreground">Esta câmara é reservada aos guardiões do reino.</p>
          <Link to="/world" className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm text-primary-foreground">
            Voltar ao mundo
          </Link>
        </main>
      </Shell>
    );
  }

  const profile = data?.profile;
  const progress = data?.progress;
  const list = (value: unknown): string[] => (Array.isArray(value) ? (value as string[]) : []);

  return (
    <Shell>
      <main className="mx-auto max-w-4xl px-5 py-10">
        <Link to="/admin" className="text-sm text-primary underline-offset-4 hover:underline">
          ← Voltar ao painel
        </Link>

        <header className="quest-panel mt-4 flex flex-wrap items-center gap-4 rounded-xl p-5">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="size-14 rounded-full object-cover" />
          ) : (
            <span aria-hidden className="grid size-14 place-items-center rounded-full bg-secondary text-xl">✶</span>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-2xl text-parchment">{profile?.full_name ?? "Viajante"}</h1>
            <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {profile?.role === "admin" ? "Guardião" : "Jogador"} ·{" "}
              {profile?.status === "active" ? "Conta ativa" : "Conta desativada"} · Último acesso{" "}
              {profile ? new Date(profile.last_seen_at).toLocaleString("pt-BR") : "—"}
            </p>
          </div>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Nível", value: progress?.level ?? 1 },
            { label: "XP", value: progress?.xp ?? 0 },
            { label: "Missões", value: `${list(progress?.completed_quests).length}/${MATERIALS.length}` },
          ].map((card) => (
            <div key={card.label} className="quest-panel rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 font-display text-2xl text-parchment">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="quest-panel mt-5 rounded-xl p-5 text-sm">
          <h2 className="font-display text-lg text-parchment">Progresso completo</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Missões dominadas</dt><dd>{list(progress?.mastered_quests).length}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Conquistas</dt><dd>{list(progress?.achievements).length}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Regiões liberadas</dt><dd>{list(progress?.unlocked_regions).join(", ") || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Mochila</dt><dd>{list(progress?.backpack).length}/{MATERIALS.length} materiais</dd></div>
            <div><dt className="text-xs text-muted-foreground">Arquétipo</dt><dd>{progress?.class_id ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Avatar</dt><dd>{progress?.avatar ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Último salvamento</dt><dd>{progress ? new Date(progress.last_saved_at).toLocaleString("pt-BR") : "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Checkpoint</dt><dd>{list(progress?.completed_quests).at(-1) ?? "—"}</dd></div>
          </dl>
        </section>

        <section className="quest-panel mt-5 rounded-xl p-5">
          <h2 className="font-display text-lg text-parchment">Ações administrativas</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {name === null ? (
              <button type="button" onClick={() => setName(profile?.full_name ?? "")} className="rounded-md border border-border px-4 py-2 text-sm">
                Editar nome
              </button>
            ) : (
              <span className="flex flex-wrap items-center gap-2">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  aria-label="Nome do jogador"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <button type="button" onClick={() => saveName.mutate(name)} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
                  Salvar
                </button>
                <button type="button" onClick={() => setName(null)} className="rounded-md border border-border px-4 py-2 text-sm">
                  Cancelar
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={() => setConfirm("disable")}
              className="rounded-md border border-border px-4 py-2 text-sm"
            >
              {profile?.status === "active" ? "Desativar conta" : "Reativar conta"}
            </button>
            <button
              type="button"
              onClick={() => setConfirm("reset")}
              className="rounded-md border border-destructive/60 px-4 py-2 text-sm text-destructive"
            >
              Resetar progresso
            </button>
          </div>

          {confirm ? (
            <div role="alertdialog" aria-label="Confirmar ação" className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
              <p>
                {confirm === "reset"
                  ? "Resetar apaga nível, XP, missões e conquistas deste jogador. A ação fica registrada no histórico."
                  : profile?.status === "active"
                    ? "Desativar impede que este jogador continue a jornada. A ação fica registrada no histórico."
                    : "Reativar devolve o acesso deste jogador ao mundo."}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    confirm === "reset"
                      ? resetProgress.mutate()
                      : toggleStatus.mutate(profile?.status === "active" ? "disabled" : "active")
                  }
                  className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground"
                >
                  Confirmar
                </button>
                <button type="button" onClick={() => setConfirm(null)} className="rounded-md border border-border px-4 py-2 text-sm">
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="quest-panel mt-5 rounded-xl p-5">
          <h2 className="font-display text-lg text-parchment">Histórico</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data?.activity.length === 0 ? (
              <li className="text-muted-foreground">Nenhum evento registrado ainda.</li>
            ) : (
              data?.activity.map((event) => (
                <li key={event.id} className="flex flex-wrap justify-between gap-2 border-b border-border/50 pb-2">
                  <span>{event.description ?? event.event_type}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString("pt-BR")}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </main>
    </Shell>
  );
}
