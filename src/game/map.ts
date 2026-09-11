import { MATERIALS } from "./data";
import type { RegionId } from "./types";

export const MAP_WIDTH = 2000;
export const MAP_HEIGHT = 1400;

export const REGION_AREAS: Record<RegionId, { x: number; y: number; w: number; h: number; label: { x: number; y: number } }> = {
  vale: { x: 90, y: 820, w: 640, h: 460, label: { x: 250, y: 880 } },
  floresta: { x: 760, y: 760, w: 620, h: 520, label: { x: 930, y: 820 } },
  planalto: { x: 1180, y: 380, w: 720, h: 460, label: { x: 1390, y: 440 } },
  cume: { x: 780, y: 90, w: 620, h: 400, label: { x: 950, y: 150 } },
};

export interface MapNode {
  materialId: string;
  region: RegionId;
  x: number;
  y: number;
  index: number;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export const MAP_NODES: MapNode[] = (() => {
  const byRegion = new Map<RegionId, number>();
  return MATERIALS.map((material) => {
    const area = REGION_AREAS[material.region];
    const index = byRegion.get(material.region) ?? 0;
    byRegion.set(material.region, index + 1);
    const columns = 4;
    const col = index % columns;
    const row = Math.floor(index / columns);
    const jitter = hash(material.id);
    const x = area.x + 90 + col * ((area.w - 170) / (columns - 1)) + ((jitter % 40) - 20);
    const y = area.y + 150 + row * 92 + (((jitter >> 5) % 30) - 15);
    return { materialId: material.id, region: material.region, x, y, index };
  });
})();

export const ROADS: string[] = [
  "M 330 1140 C 520 1090, 640 1030, 830 1000",
  "M 980 960 C 1120 900, 1210 800, 1330 720",
  "M 1420 560 C 1330 440, 1180 340, 1050 300",
];

export const PORTALS: { region: RegionId; x: number; y: number; name: string }[] = [
  { region: "floresta", x: 830, y: 1000, name: "Portal de Vertha" },
  { region: "planalto", x: 1330, y: 720, name: "Portão das Muralhas" },
  { region: "cume", x: 1050, y: 300, name: "Passagem da Névoa" },
];

export const LANDMARKS: { x: number; y: number; label: string; kind: "vila" | "torre" | "forte" | "biblioteca" | "ruina" }[] = [
  { x: 250, y: 1120, label: "Vila do Vale", kind: "vila" },
  { x: 470, y: 990, label: "Biblioteca de Pedra", kind: "biblioteca" },
  { x: 1010, y: 1180, label: "Oficinas da Mata", kind: "ruina" },
  { x: 1620, y: 620, label: "Forte Meridiano", kind: "forte" },
  { x: 980, y: 210, label: "Torre Silente", kind: "torre" },
];
