import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AvatarView } from "@/components/game/AvatarView";
import { Shell } from "@/components/game/Shell";
import { AVATARS, getAvatar } from "@/game/avatars";
import { MATERIALS, REGIONS, axisName, regionName } from "@/game/data";
import {
  getBackpackProgress,
  getLevelTitle,
  getQuestProgress,
  getVitality,
  isRegionUnlocked,
} from "@/game/rules";
import { useGame } from "@/game/state";
import type { RegionId } from "@/game/types";

export const Route = createFileRoute("/backpack")({
  head: () => ({
    meta: [
      { title: "Mochila e materiais — PDI QUEST" },
      {
        name: "description",
        content:
          "Seu avatar 3D, nível, dano acumulado e a lista completa de materiais do PDI para marcar como lidos.",
      },
      { property: "og:title", content: "Mochila e materiais — PDI QUEST" },
      {
        property: "og:description",
        content: "Encha a mochila marcando cada material do PDI como visto ou lido.",
      },
    ],
  }),
  component: BackpackScreen,
});

function BackpackScreen() {
  const { save, level, toggleMaterialSeen, changeAvatar } = useGame();
  const player = save.player;
  const [region, setRegion] = useState<RegionId | "todas">("todas");

  const vitality = getVitality(save);
  const backpack = getBackpackProgress(save);
  const list = useMemo(
    () => (region === "todas" ? MATERIALS : MATERIALS.filter((m) => m.region === region)),
    [region],
  );

  if (!player) {
    return (
      <Shell>
        <main className="mx-auto max-w-2xl px-5 py-16">
          <h1 className="font-display text-2xl text-parchment">Nenhum personagem criado</h1>
          <Link
            to="/character"
            className="mt-4 inline-block rounded-md bg-primary px-5 py-2.5 text-primary-foreground"
          >
            Criar personagem
          </Link>
        </main>
      </Shell>
    );
  }

  const avatar = getAvatar(player.avatar);

  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-display text-3xl text-parchment sm:text-4xl">Mochila do viajante</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Todo material do PDI vive aqui. Marque como visto ou lido para encher a mochila — e acompanhe o
          dano que as respostas erradas causaram no caminho.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
          <section className="space-y-4">
            <AvatarView avatar={player.avatar} interactive className="h-72 w-full" />

            <div className="quest-panel rounded-xl p-5">
              <p className="font-display text-2xl text-parchment">{player.name}</p>
              <p className="text-xs text-primary">
                {avatar.name} · {avatar.tagline}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nível {level} · {getLevelTitle(level)} · {player.xp} XP
              </p>

              <div className="mt-4">
                <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>Vitalidade</span>
                  <span>
                    {vitality.hp}/{vitality.maxHp}
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-destructive/80 transition-[width] duration-500"
                    style={{ width: `${vitality.hp}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {vitality.wounds} dano por respostas erradas · {vitality.healed} cura por acertos em
                  retomada
                </p>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>Mochila</span>
                  <span>
                    {backpack.done}/{backpack.total} materiais
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${(backpack.done / backpack.total) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs text-muted-foreground">Trocar avatar</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {AVATARS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => changeAvatar(option.id)}
                      aria-pressed={player.avatar === option.id}
                      className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                        player.avatar === option.id
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-wrap gap-2">
              {(["todas", ...REGIONS.map((r) => r.id)] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRegion(id)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    region === id
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {id === "todas" ? "Todos os territórios" : regionName(id)}
                </button>
              ))}
            </div>

            <ul className="mt-4 space-y-3">
              {list.map((material) => {
                const seen = save.progress.seenMaterials.includes(material.id);
                const unlocked = isRegionUnlocked(player.xp, material.region);
                const progress = getQuestProgress(save, material.id);
                const completed = save.progress.completedQuests.includes(material.id);
                return (
                  <li key={material.id} className="quest-panel rounded-xl p-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleMaterialSeen(material.id)}
                        aria-pressed={seen}
                        aria-label={
                          seen
                            ? `Desmarcar ${material.name} como visto`
                            : `Marcar ${material.name} como visto ou lido`
                        }
                        className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border text-sm transition-colors ${
                          seen
                            ? "border-success bg-success/20 text-success"
                            : "border-border text-muted-foreground hover:border-primary"
                        }`}
                      >
                        {seen ? "✓" : ""}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg leading-snug text-parchment">{material.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {material.source} · {material.kind} · {material.duration} · {material.access}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {material.objective}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">
                            {regionName(material.region)}
                          </span>
                          <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">
                            {axisName(material.axis)}
                          </span>
                          <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">
                            {material.questionCount} desafios · {material.totalXP} XP
                          </span>
                          <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">
                            {completed
                              ? "Missão concluída"
                              : `Desafios ${progress.done}/${progress.total}`}
                          </span>
                          {material.url && (
                            <a
                              href={material.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-primary/50 px-2.5 py-1 text-primary hover:bg-primary/10"
                            >
                              Abrir material
                            </a>
                          )}
                          {unlocked ? (
                            <Link
                              to="/quest/$questId"
                              params={{ questId: material.id }}
                              className="rounded-full bg-primary px-2.5 py-1 text-primary-foreground"
                            >
                              Ir à missão
                            </Link>
                          ) : (
                            <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">
                              Território bloqueado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </main>
    </Shell>
  );
}
