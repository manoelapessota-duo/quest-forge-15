import { useCallback, useEffect, useRef, useState } from "react";
import { MATERIALS, REGIONS } from "@/game/data";
import { LANDMARKS, MAP_HEIGHT, MAP_NODES, MAP_WIDTH, PORTALS, REGION_AREAS, ROADS } from "@/game/map";
import { getQuestStatus, isRegionUnlocked } from "@/game/rules";
import { useGame } from "@/game/state";
import type { RegionId } from "@/game/types";

const STATUS_FILL: Record<string, string> = {
  locked: "var(--stone)",
  available: "var(--primary)",
  in_progress: "var(--water)",
  completed: "var(--success)",
};

export function WorldMap({ onSelect }: { onSelect: (materialId: string) => void }) {
  const { save } = useGame();
  const xp = save.player?.xp ?? 0;
  const [view, setView] = useState({ x: 40, y: 700, scale: 1 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const box = useRef<HTMLDivElement | null>(null);

  const clamp = useCallback((next: typeof view) => {
    const w = MAP_WIDTH / next.scale;
    const h = MAP_HEIGHT / next.scale;
    return {
      scale: next.scale,
      x: Math.max(0, Math.min(MAP_WIDTH - w, next.x)),
      y: Math.max(0, Math.min(MAP_HEIGHT - h, next.y)),
    };
  }, []);

  const zoom = useCallback(
    (factor: number) => {
      setView((v) => {
        const scale = Math.max(0.6, Math.min(2.6, v.scale * factor));
        const cx = v.x + MAP_WIDTH / v.scale / 2;
        const cy = v.y + MAP_HEIGHT / v.scale / 2;
        return clamp({ scale, x: cx - MAP_WIDTH / scale / 2, y: cy - MAP_HEIGHT / scale / 2 });
      });
    },
    [clamp],
  );

  const center = useCallback(
    (px: number, py: number) => {
      setView((v) => clamp({ ...v, x: px - MAP_WIDTH / v.scale / 2, y: py - MAP_HEIGHT / v.scale / 2 }));
    },
    [clamp],
  );

  useEffect(() => {
    const start = LANDMARKS[0]!;
    center(start.x, start.y);
  }, [center]);

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    drag.current = { x: event.clientX, y: event.clientY, vx: view.x, vy: view.y };
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const state = drag.current;
    if (!state || !box.current) return;
    const rect = box.current.getBoundingClientRect();
    const unitsPerPx = MAP_WIDTH / view.scale / rect.width;
    setView((v) =>
      clamp({
        ...v,
        x: state.vx - (event.clientX - state.x) * unitsPerPx,
        y: state.vy - (event.clientY - state.y) * unitsPerPx,
      }),
    );
  }

  const playerSpot = LANDMARKS[0]!;

  return (
    <div className="relative">
      <div
        ref={box}
        className="overflow-hidden rounded-xl border border-border bg-[oklch(0.22_0.04_170)]"
      >
        <svg
          role="application"
          aria-label="Mapa do mundo do PDI QUEST"
          viewBox={`${view.x} ${view.y} ${MAP_WIDTH / view.scale} ${MAP_HEIGHT / view.scale}`}
          className="aspect-[4/3] w-full cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onWheel={(e) => {
            e.preventDefault();
            zoom(e.deltaY < 0 ? 1.12 : 0.89);
          }}
        >
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} fill="oklch(0.28 0.05 168)" />
          <path
            d={`M 0 ${MAP_HEIGHT} L 0 900 C 400 860, 700 1000, 1000 940 C 1400 870, 1700 960, ${MAP_WIDTH} 900 L ${MAP_WIDTH} ${MAP_HEIGHT} Z`}
            fill="oklch(0.34 0.07 150)"
          />
          <path
            d="M 120 1400 C 380 1150, 560 1080, 900 1010 C 1240 940, 1500 800, 1900 640"
            stroke="var(--water)"
            strokeWidth={26}
            fill="none"
            strokeOpacity={0.55}
          />

          {REGIONS.map((region) => {
            const area = REGION_AREAS[region.id];
            const unlocked = isRegionUnlocked(xp, region.id);
            return (
              <g key={region.id}>
                <rect
                  x={area.x}
                  y={area.y}
                  width={area.w}
                  height={area.h}
                  rx={48}
                  fill={unlocked ? region.color : "var(--stone)"}
                  fillOpacity={unlocked ? 0.24 : 0.32}
                  stroke={unlocked ? region.color : "var(--stone)"}
                  strokeOpacity={0.6}
                  strokeDasharray={unlocked ? undefined : "14 10"}
                />
                <text
                  x={area.label.x}
                  y={area.label.y}
                  fill="var(--parchment)"
                  fontSize={40}
                  fontFamily="var(--font-display)"
                  opacity={unlocked ? 0.95 : 0.6}
                >
                  {region.name}
                </text>
                {!unlocked && (
                  <text x={area.label.x} y={area.label.y + 34} fill="var(--parchment)" fontSize={24} opacity={0.7}>
                    Selado até o nível {region.unlockLevel}
                  </text>
                )}
              </g>
            );
          })}

          {ROADS.map((road) => (
            <path
              key={road}
              d={road}
              stroke="var(--parchment)"
              strokeOpacity={0.35}
              strokeWidth={12}
              strokeDasharray="26 18"
              fill="none"
            />
          ))}

          {LANDMARKS.map((mark) => (
            <g key={mark.label}>
              <circle cx={mark.x} cy={mark.y} r={26} fill="var(--parchment)" fillOpacity={0.85} />
              <rect x={mark.x - 12} y={mark.y - 20} width={24} height={22} fill="var(--stone)" />
              <text x={mark.x} y={mark.y + 48} textAnchor="middle" fill="var(--parchment)" fontSize={24}>
                {mark.label}
              </text>
            </g>
          ))}

          {PORTALS.map((portal) => {
            const unlocked = isRegionUnlocked(xp, portal.region);
            return (
              <g key={portal.name} className={unlocked ? "pdi-float" : undefined}>
                <circle cx={portal.x} cy={portal.y} r={40} fill="url(#glow)" />
                <ellipse
                  cx={portal.x}
                  cy={portal.y}
                  rx={20}
                  ry={30}
                  fill={unlocked ? "var(--magic)" : "var(--stone)"}
                  fillOpacity={0.85}
                />
                <text x={portal.x} y={portal.y + 58} textAnchor="middle" fill="var(--parchment)" fontSize={22}>
                  {portal.name}
                </text>
              </g>
            );
          })}

          <g aria-hidden="true" pointerEvents="none">
            {MAP_NODES.filter((node) => getQuestStatus(save, node.materialId) === "available").map((node) => (
              <circle
                key={`ring-${node.materialId}`}
                cx={node.x}
                cy={node.y}
                r={18}
                fill="var(--primary)"
                className="pdi-ring"
              />
            ))}
          </g>

          {MAP_NODES.map((node) => {
            const material = MATERIALS.find((m) => m.id === node.materialId)!;
            const status = getQuestStatus(save, node.materialId);
            return (
              <g
                key={node.materialId}
                tabIndex={0}
                role="button"
                aria-label={`${material.name} — ${status}`}
                onClick={() => onSelect(node.materialId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect(node.materialId);
                }}
                className="cursor-pointer outline-none focus-visible:opacity-80"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={14}
                  fill={STATUS_FILL[status]}
                  stroke="var(--parchment)"
                  strokeOpacity={0.8}
                  strokeWidth={3}
                />
                {status === "completed" && (
                  <text x={node.x} y={node.y + 7} textAnchor="middle" fontSize={18} fill="var(--parchment)">
                    ✓
                  </text>
                )}
              </g>
            );
          })}

          <g className="pdi-float">
            <circle cx={playerSpot.x} cy={playerSpot.y - 60} r={16} fill="var(--primary)" />
            <rect x={playerSpot.x - 10} y={playerSpot.y - 46} width={20} height={30} rx={8} fill="var(--primary)" />
          </g>
        </svg>
      </div>

      <div className="absolute right-3 top-3 flex flex-col gap-2">
        {[
          { label: "+", action: () => zoom(1.2), title: "Aproximar" },
          { label: "−", action: () => zoom(0.83), title: "Afastar" },
          { label: "⌖", action: () => center(playerSpot.x, playerSpot.y), title: "Centralizar" },
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            title={btn.title}
            aria-label={btn.title}
            onClick={btn.action}
            className="grid size-9 place-items-center rounded-md border border-border bg-card/90 text-lg text-foreground hover:bg-secondary"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
