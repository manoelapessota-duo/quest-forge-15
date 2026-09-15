import { Link, createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/game/Shell";
import { AXES, MATERIALS } from "@/game/data";
import { getAxisStats, getQuestStatus } from "@/game/rules";
import { useGame } from "@/game/state";

export const Route = createFileRoute("/competencies")({
  head: () => ({
    meta: [
      { title: "Constelação de competências — PDI QUEST" },
      { name: "description", content: "Cobertura, precisão e oportunidades nos oito eixos do ofício de design." },
      { property: "og:title", content: "Constelação de competências — PDI QUEST" },
      { property: "og:description", content: "Veja onde você é forte e onde há terreno a explorar." },
    ],
  }),
  component: CompetenciesScreen,
});

function CompetenciesScreen() {
  const { save } = useGame();
  const stats = getAxisStats(save);
  const size = 320;
  const center = size / 2;
  const radius = center - 46;

  const points = stats.map((stat, index) => {
    const angle = (index / stats.length) * Math.PI * 2 - Math.PI / 2;
    const value = Math.max(0.06, stat.accuracy / 100);
    return {
      stat,
      angle,
      x: center + Math.cos(angle) * radius * value,
      y: center + Math.sin(angle) * radius * value,
      ax: center + Math.cos(angle) * radius,
      ay: center + Math.sin(angle) * radius,
    };
  });

  const opportunities = [...stats].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
  const oppAxes = new Set(opportunities.map((o) => o.axis));
  const suggestions = MATERIALS.filter(
    (m) => oppAxes.has(m.axis) && ["available", "in_progress"].includes(getQuestStatus(save, m.id)),
  ).slice(0, 5);

  return (
    <Shell>
      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="font-display text-3xl text-parchment">Constelação de competências</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cada estrela é um eixo do ofício. O brilho cresce com a precisão das suas respostas.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="quest-panel grid place-items-center rounded-xl p-4">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-80" role="img" aria-label="Radar de competências">
              {[0.25, 0.5, 0.75, 1].map((ring) => (
                <circle
                  key={ring}
                  cx={center}
                  cy={center}
                  r={radius * ring}
                  fill="none"
                  stroke="var(--border)"
                  strokeOpacity={0.7}
                />
              ))}
              {points.map((p) => (
                <line
                  key={p.stat.axis}
                  x1={center}
                  y1={center}
                  x2={p.ax}
                  y2={p.ay}
                  stroke="var(--border)"
                  strokeOpacity={0.6}
                />
              ))}
              <polygon
                points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="var(--primary)"
                fillOpacity={0.28}
                stroke="var(--primary)"
                strokeWidth={2}
              />
              {points.map((p) => (
                <circle key={`dot-${p.stat.axis}`} cx={p.x} cy={p.y} r={4} fill="var(--primary)" />
              ))}
              {points.map((p) => {
                const lx = center + Math.cos(p.angle) * (radius + 18);
                const ly = center + Math.sin(p.angle) * (radius + 18);
                const anchor = Math.abs(Math.cos(p.angle)) < 0.3 ? "middle" : Math.cos(p.angle) > 0 ? "start" : "end";
                return (
                  <text
                    key={`label-${p.stat.axis}`}
                    x={lx}
                    y={ly}
                    textAnchor={anchor}
                    dominantBaseline="middle"
                    fontSize={11}
                    fill="var(--muted-foreground)"
                  >
                    {AXES.find((a) => a.id === p.stat.axis)?.short ?? p.stat.axis}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="quest-panel rounded-xl p-5">
            <ul className="space-y-3">
              {stats.map((stat) => (
                <li key={stat.axis}>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{stat.name}</span>
                    <span className="text-muted-foreground">
                      {stat.accuracy}% · cobertura {stat.coverage}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(2, stat.accuracy)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.asked} de {stat.total} desafios enfrentados
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {suggestions.length > 0 && (
          <section className="quest-panel mt-6 rounded-xl p-5">
            <h2 className="font-display text-xl text-parchment">Oportunidades abertas</h2>
            <ul className="mt-3 space-y-2">
              {suggestions.map((material) => (
                <li key={material.id}>
                  <Link
                    to="/quest/$questId"
                    params={{ questId: material.id }}
                    className="block rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm transition-colors hover:border-primary/60"
                  >
                    {material.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </Shell>
  );
}
