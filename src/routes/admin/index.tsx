import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/game/Shell";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { LEVELS, MATERIALS } from "@/game/data";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — PDI QUEST" },
      { name: "description", content: "Acompanhe jogadores, níveis e progresso do PDI QUEST." },
      { property: "og:title", content: "Painel administrativo — PDI QUEST" },
      { property: "og:description", content: "Visão geral de jogadores e evolução no PDI QUEST." },
    ],
  }),
  component: AdminScreen,
});

interface Row {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  status: string;
  created_at: string;
  last_seen_at: string;
  level: number;
  xp: number;
  completed: number;
}

const PAGE_SIZE = 10;

function AdminScreen() {
  const { isAdmin, loading } = useAuth();
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState<"todos" | "active" | "disabled">("todos");
  const [sort, setSort] = useState<"xp" | "name" | "last">("xp");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin,
    queryFn: async (): Promise<Row[]> => {
      const [{ data: profiles }, { data: progress }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url, role, status, created_at, last_seen_at"),
        supabase.from("game_progress").select("user_id, level, xp, completed_quests"),
      ]);
      const byUser = new Map((progress ?? []).map((p) => [p.user_id, p]));
      return (profiles ?? []).map((profile) => {
        const p = byUser.get(profile.id);
        const completed = Array.isArray(p?.completed_quests) ? p.completed_quests.length : 0;
        return { ...profile, level: p?.level ?? 1, xp: p?.xp ?? 0, completed };
      });
    },
  });

  const rows = useMemo(() => {
    let list = data ?? [];
    if (term.trim()) {
      const q = term.trim().toLowerCase();
      list = list.filter(
        (r) => (r.full_name ?? "").toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q),
      );
    }
    if (status !== "todos") list = list.filter((r) => r.status === status);
    return [...list].sort((a, b) => {
      if (sort === "name") return (a.full_name ?? "").localeCompare(b.full_name ?? "");
      if (sort === "last") return b.last_seen_at.localeCompare(a.last_seen_at);
      return b.xp - a.xp;
    });
  }, [data, term, status, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const stats = useMemo(() => {
    const list = data ?? [];
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const active = list.filter((r) => new Date(r.last_seen_at).getTime() > weekAgo).length;
    const novos = list.filter((r) => new Date(r.created_at).getTime() > weekAgo).length;
    const media =
      list.length === 0
        ? 0
        : Math.round(
            (list.reduce((sum, r) => sum + r.completed, 0) / (list.length * MATERIALS.length)) * 100,
          );
    const byLevel = LEVELS.map((l) => ({
      level: l.level,
      title: l.title,
      count: list.filter((r) => r.level === l.level).length,
    }));
    return { total: list.length, active, novos, media, byLevel };
  }, [data]);

  if (loading) return <Shell><main className="mx-auto max-w-3xl px-5 py-16 text-sm text-muted-foreground">Verificando permissões…</main></Shell>;

  if (!isAdmin) {
    return (
      <Shell>
        <main className="mx-auto max-w-lg px-5 py-20 text-center">
          <h1 className="font-display text-2xl text-parchment">Portão selado</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Esta câmara é reservada aos guardiões do reino. Sua conta não tem essa permissão.
          </p>
          <Link to="/world" className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm text-primary-foreground">
            Voltar ao mundo
          </Link>
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-display text-3xl text-parchment">Câmara dos Guardiões</h1>
        <p className="mt-2 text-sm text-muted-foreground">Acompanhe a evolução de cada viajante do PDI QUEST.</p>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Jogadores", value: stats.total },
            { label: "Ativos (7 dias)", value: stats.active },
            { label: "Novos (7 dias)", value: stats.novos },
            { label: "Progresso médio", value: `${stats.media}%` },
          ].map((card) => (
            <div key={card.label} className="quest-panel rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 font-display text-2xl text-parchment">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="quest-panel mt-5 rounded-xl p-5">
          <h2 className="font-display text-lg text-parchment">Distribuição por nível</h2>
          <ul className="mt-3 space-y-2">
            {stats.byLevel.map((entry) => (
              <li key={entry.level} className="flex items-center gap-3 text-xs">
                <span className="w-40 shrink-0 truncate text-muted-foreground">
                  Nv {entry.level} · {entry.title}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${stats.total ? (entry.count / stats.total) * 100 : 0}%` }}
                  />
                </span>
                <span className="w-8 text-right text-foreground">{entry.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="quest-panel mt-5 rounded-xl p-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex-1 text-xs text-muted-foreground">
              Buscar
              <input
                value={term}
                onChange={(event) => {
                  setTerm(event.target.value);
                  setPage(0);
                }}
                placeholder="Nome ou e-mail"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Situação
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as typeof status)}
                className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="todos">Todas</option>
                <option value="active">Ativos</option>
                <option value="disabled">Desativados</option>
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Ordenar
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
                className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="xp">Maior XP</option>
                <option value="name">Nome</option>
                <option value="last">Último acesso</option>
              </select>
            </label>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="py-2">Jogador</th>
                  <th className="py-2">Nível</th>
                  <th className="py-2">XP</th>
                  <th className="py-2">Missões</th>
                  <th className="py-2">Último acesso</th>
                  <th className="py-2">Cadastro</th>
                  <th className="py-2">Situação</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="py-6 text-muted-foreground">Carregando jogadores…</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan={7} className="py-6 text-muted-foreground">Nenhum jogador encontrado.</td></tr>
                ) : (
                  visible.map((row) => (
                    <tr key={row.id} className="border-t border-border/60">
                      <td className="py-2">
                        <Link to="/admin/$userId" params={{ userId: row.id }} className="flex items-center gap-2 text-primary hover:underline">
                          {row.avatar_url ? (
                            <img src={row.avatar_url} alt="" className="size-7 rounded-full object-cover" />
                          ) : (
                            <span aria-hidden className="grid size-7 place-items-center rounded-full bg-secondary text-xs">✶</span>
                          )}
                          <span className="min-w-0">
                            <span className="block truncate">{row.full_name ?? "Viajante"}</span>
                            <span className="block truncate text-xs text-muted-foreground">{row.email}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="py-2">{row.level}</td>
                      <td className="py-2">{row.xp}</td>
                      <td className="py-2">{row.completed}/{MATERIALS.length}</td>
                      <td className="py-2 text-xs">{new Date(row.last_seen_at).toLocaleString("pt-BR")}</td>
                      <td className="py-2 text-xs">{new Date(row.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="py-2 text-xs">{row.status === "active" ? "Ativo" : "Desativado"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Página {page + 1} de {pages}
            </span>
            <span className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                disabled={page >= pages - 1}
                className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40"
              >
                Próxima
              </button>
            </span>
          </div>
        </section>
      </main>
    </Shell>
  );
}
