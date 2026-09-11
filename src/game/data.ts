import materialsJson from "@/data/materials.json";
import questionsJson from "@/data/questions.json";
import type { AxisId, ClassId, Material, Question, RegionId } from "./types";

export const MATERIALS = materialsJson as Material[];
export const QUESTIONS = questionsJson as Question[];

export const AXES: { id: AxisId; name: string; short: string }[] = [
  { id: "figma", name: "Domínio de Figma", short: "Figma" },
  { id: "ai", name: "Inteligência Artificial aplicada", short: "IA" },
  { id: "strategy", name: "Estratégia e processo", short: "Estratégia" },
  { id: "adobe", name: "Ferramentas Adobe", short: "Adobe" },
  { id: "creative", name: "Repertório criativo", short: "Criação" },
  { id: "formal", name: "Fundamentos formais", short: "Fundamentos" },
  { id: "image", name: "Imagem e produção visual", short: "Imagem" },
  { id: "accessibility", name: "Acessibilidade e inclusão", short: "Acessibilidade" },
];

export const REGIONS: {
  id: RegionId;
  name: string;
  lore: string;
  unlockLevel: number;
  color: string;
}[] = [
  {
    id: "vale",
    name: "Vale de Aurora",
    lore: "Campos abertos, a vila dos aprendizes e as primeiras oficinas de forma e ferramenta.",
    unlockLevel: 1,
    color: "var(--leaf)",
  },
  {
    id: "floresta",
    name: "Floresta de Vertha",
    lore: "Trilhas densas onde a criação encontra o inesperado e os mecanismos ganham vida.",
    unlockLevel: 6,
    color: "var(--success)",
  },
  {
    id: "planalto",
    name: "Planalto das Fortalezas",
    lore: "Muralhas de método, sistemas e decisões que sustentam mundos inteiros.",
    unlockLevel: 10,
    color: "var(--water)",
  },
  {
    id: "cume",
    name: "Cume Silente",
    lore: "Névoa, neve e a Torre onde o ofício vira maestria.",
    unlockLevel: 14,
    color: "var(--magic)",
  },
];

export const CLASSES: {
  id: ClassId;
  name: string;
  tagline: string;
  description: string;
  glyph: string;
}[] = [
  {
    id: "arqueiro",
    name: "Arqueiro",
    tagline: "Precisão e forma",
    description:
      "Mira longa e traço limpo. Enxerga alinhamento, ritmo e detalhe antes de qualquer um.",
    glyph: "➶",
  },
  {
    id: "cacador",
    name: "Caçador",
    tagline: "Rastro e descoberta",
    description: "Segue pistas, testa hipóteses e volta da mata com repertório novo na mochila.",
    glyph: "❂",
  },
  {
    id: "mago",
    name: "Mago",
    tagline: "Sistema e magia",
    description: "Transforma regras em encantos: componentes, automações e inteligência aplicada.",
    glyph: "✶",
  },
];

// Tabela oficial de 20 níveis (XP acumulado necessário).
export const LEVELS: { level: number; xp: number; title: string }[] = [
  { level: 1, xp: 0, title: "Aprendiz do Vale" },
  { level: 2, xp: 250, title: "Andarilho" },
  { level: 3, xp: 550, title: "Explorador" },
  { level: 4, xp: 900, title: "Batedor" },
  { level: 5, xp: 1300, title: "Guardião do Traço" },
  { level: 6, xp: 1750, title: "Viajante de Vertha" },
  { level: 7, xp: 2250, title: "Artesão" },
  { level: 8, xp: 2800, title: "Artífice" },
  { level: 9, xp: 3400, title: "Rastreador Maior" },
  { level: 10, xp: 4050, title: "Sentinela do Planalto" },
  { level: 11, xp: 4750, title: "Engenheiro de Sistemas" },
  { level: 12, xp: 5500, title: "Estrategista" },
  { level: 13, xp: 6300, title: "Mestre de Oficina" },
  { level: 14, xp: 7150, title: "Peregrino do Cume" },
  { level: 15, xp: 8050, title: "Conjurador" },
  { level: 16, xp: 9000, title: "Arquiteto do Ofício" },
  { level: 17, xp: 9800, title: "Guardião da Torre" },
  { level: 18, xp: 10600, title: "Alto Artífice" },
  { level: 19, xp: 11300, title: "Sábio do Cume" },
  { level: 20, xp: 12000, title: "Lenda do PDI" },
];

export const ACHIEVEMENTS: { id: string; name: string; description: string }[] = [
  { id: "first-steps", name: "Primeiros Passos", description: "Conclua sua primeira missão." },
  { id: "diagnostic", name: "Olhar Revelado", description: "Complete a missão de diagnóstico." },
  { id: "mastery", name: "Selo de Domínio", description: "Acerte 8+ de 10 em uma missão." },
  { id: "explorer", name: "Explorador", description: "Conclua 10 missões." },
  { id: "vertha", name: "Portal de Vertha", description: "Desbloqueie a Floresta de Vertha." },
  { id: "planalto", name: "Muralhas Abertas", description: "Desbloqueie o Planalto das Fortalezas." },
  { id: "cume", name: "Névoa Vencida", description: "Desbloqueie o Cume Silente." },
  { id: "boss", name: "Chefão Derrotado", description: "Vença um Chefão Semanal com 8+ acertos." },
  { id: "legend", name: "Lenda do PDI", description: "Alcance o nível 20." },
];

export const TOTAL_QUESTIONS = QUESTIONS.length;
export const TOTAL_XP = QUESTIONS.reduce((sum, q) => sum + q.xp, 0);

export function getMaterial(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id);
}

export function getQuestionsForMaterial(materialId: string): Question[] {
  return QUESTIONS.filter((q) => q.materialId === materialId).sort((a, b) => a.number - b.number);
}

export function axisName(id: AxisId | string): string {
  return AXES.find((a) => a.id === id)?.name ?? id;
}

export function regionName(id: RegionId | string): string {
  return REGIONS.find((r) => r.id === id)?.name ?? id;
}

export const DIFFICULTY_LABEL: Record<string, string> = {
  light: "Leve",
  medium: "Média",
  advanced: "Avançada",
  challenge: "Desafio",
};

export const TYPE_LABEL: Record<string, string> = {
  multiple_choice: "Múltipla escolha",
  true_false: "Verdadeiro ou falso",
  matching: "Associação",
};
