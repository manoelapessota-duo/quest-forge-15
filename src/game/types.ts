export type RegionId = "vale" | "floresta" | "planalto" | "cume";

export type AxisId =
  | "figma"
  | "ai"
  | "strategy"
  | "adobe"
  | "creative"
  | "formal"
  | "image"
  | "accessibility";

export type Difficulty = "light" | "medium" | "advanced" | "challenge";
export type QuestionType = "multiple_choice" | "true_false" | "matching";
export type ClassId = "arqueiro" | "cacador" | "mago";

export interface Question {
  id: string;
  region: RegionId;
  materialId: string;
  axis: AxisId;
  number: number;
  difficulty: Difficulty;
  xp: number;
  type: QuestionType;
  prompt: string;
  options: string[];
  answerIndex: number;
  answerText: string;
  explanation: string;
  needsVisual?: boolean;
}

export interface Material {
  id: string;
  region: RegionId;
  name: string;
  source: string;
  kind: string;
  access: string;
  duration: string;
  objective: string;
  scope: string;
  impact?: string;
  url?: string;
  questionCount: number;
  totalXP: number;
  axis: AxisId;
}

export interface AnswerRecord {
  questionId: string;
  materialId: string;
  region: RegionId;
  axis: AxisId;
  difficulty: Difficulty;
  correct: boolean;
  xpAwarded: number;
  attempt: number;
  at: number;
  context: "quest" | "diagnostic" | "boss";
}

export interface WeeklyBossRun {
  weekKey: string;
  at: number;
  correct: number;
  total: number;
  xp: number;
  trophy: boolean;
}

export interface Player {
  name: string;
  classId: ClassId;
  createdAt: number;
  classChangedAt: number;
  xp: number;
}

export interface DiagnosticResult {
  at: number;
  perAxis: Record<string, { asked: number; correct: number }>;
}

export interface Progress {
  completedQuests: string[];
  masteredQuests: string[];
  prologueSeen: boolean;
  diagnostic: DiagnosticResult | null;
  achievements: string[];
}

export interface Settings {
  sound: boolean;
  animations: boolean;
}

export interface GameSave {
  player: Player | null;
  progress: Progress;
  answers: AnswerRecord[];
  weeklyBoss: WeeklyBossRun[];
  settings: Settings;
}
