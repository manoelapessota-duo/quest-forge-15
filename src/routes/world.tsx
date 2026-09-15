import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/game/Shell";
import { WorldMap } from "@/components/game/WorldMap";
import { MATERIALS, REGIONS, axisName, getMaterial } from "@/game/data";
import { getQuestProgress, getQuestStatus, getRegionProgress, isRegionUnlocked } from "@/game/rules";
import { useGame } from "@/game/state";

export const Route = createFileRoute("/world")({
  head: () => ({
    meta: [
      { title: "Mapa do mundo — PDI QUEST" },
      {
        name: "description",
        content: "Explore Vale de Aurora, Floresta de Vertha, Planalto das Fortalezas e Cume Silente.",
      },
      { property: "og:title", content: "Mapa do mundo — PDI QUEST" },
      { property: "og:description", content: "Quatro territórios, 48 missões e portais a desbloquear." },
    ],
  }),
  component: WorldScreen,
});

const STATUS_LABEL: Record<string, string> = {
  locked: "Selada",
  available: "Disponível",
  in_progress: "Em andamento",
  completed: "Concluída",
};

function WorldScreen() {
  const { save, hydrated } = useGame();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !save.player) navigate({ to: "/character", replace: true });
  }, [hydrated, save.player, navigate]);

  const material = selected ? getMaterial(selected) : undefined;
  const status = selected ? getQuestStatus(save, selected) : "locked";
  const progress = selected ? getQuestProgress(save, selected) : { done: 0, total: 0 };

  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="font-display text-2xl text-parchment sm:text-3xl">Mapa do mundo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arraste para explorar, use a roda ou os botões para aproximar. Cada marcador é uma missão real.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
          <WorldMap onSelect={setSelected} />

          <aside className="space-y-4">
            {material ? (
              <div className="quest-panel rounded-xl p-5">
                <p className="text-xs text-primary uppercase tracking-widest">{STATUS_LABEL[status]}</p>
                <h2 className="mt-2 font-display text-xl text-parchment">{material.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {axisName(material.axis)} · {material.kind} · {material.duration}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{material.objective}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {progress.done}/{progress.total} desafios enfrentados · {material.totalXP} XP
                </p>
                {status === "locked" ? (
                  <p className="mt-4 rounded-md border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
                    Um guardião fecha esta passagem. Suba de nível no território atual para abri-la.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/quest/$questId", params: { questId: material.id } })}
                    className="mt-4 w-full rounded-md bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    {status === "completed" ? "Revisitar missão" : "Iniciar missão"}
                  </button>
                )}
              </div>
            ) : (
              <div className="quest-panel rounded-xl p-5 text-sm text-muted-foreground">
                Toque em um marcador do mapa para ver a missão, seu objetivo e o XP em jogo.
              </div>
            )}

            <div className="quest-panel rounded-xl p-5">
              <h2 className="font-display text-lg text-parchment">Territórios</h2>
              <ul className="mt-3 space-y-3 text-sm">
                {REGIONS.map((region) => {
                  const unlocked = isRegionUnlocked(save.player?.xp ?? 0, region.id);
                  const rp = getRegionProgress(save, region.id);
                  const total = MATERIALS.filter((m) => m.region === region.id).length;
                  return (
                    <li key={region.id}>
                      <div className="flex justify-between">
                        <span className={unlocked ? "text-foreground" : "text-muted-foreground"}>{region.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {unlocked ? `${rp.done}/${total}` : `Nível ${region.unlockLevel}`}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${total ? (rp.done / total) * 100 : 0}%`,
                            background: unlocked ? "var(--success)" : "var(--stone)",
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </Shell>
  );
}
