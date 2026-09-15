import type { AvatarId } from "./types";

export interface AvatarOption {
  id: AvatarId;
  name: string;
  tagline: string;
  description: string;
  /** Cores originais usadas na escultura 3D do avatar. */
  skin: string;
  robe: string;
  trim: string;
  hair: string;
}

export const AVATARS: AvatarOption[] = [
  {
    id: "mulher",
    name: "Mulher",
    tagline: "Guardiã das Trilhas",
    description: "Manto longo e postura firme, feita para percursos longos e decisões atentas.",
    skin: "#d9a37c",
    robe: "#7c3aed",
    trim: "#f0abfc",
    hair: "#2b1b3d",
  },
  {
    id: "homem",
    name: "Homem",
    tagline: "Andarilho do Vale",
    description: "Capa curta e passo largo, sempre pronto para abrir a próxima estrada.",
    skin: "#c98d63",
    robe: "#5b21b6",
    trim: "#c4b5fd",
    hair: "#1f1730",
  },
  {
    id: "mistico",
    name: "Místico",
    tagline: "Voz do Cume",
    description: "Silhueta encapuzada e brilho próprio, guiado por intuição e estudo.",
    skin: "#b48ee8",
    robe: "#3b0f6b",
    trim: "#e9d5ff",
    hair: "#0f0a1a",
  },
];

export function getAvatar(id: AvatarId | undefined): AvatarOption {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[2]!;
}
