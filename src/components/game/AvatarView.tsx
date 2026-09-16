import womanPortrait from "@/assets/avatar-woman-premium.jpg";
import manPortrait from "@/assets/avatar-man-premium.jpg";
import mysticPortrait from "@/assets/avatar-mystic-premium.jpg";
import { getAvatar } from "@/game/avatars";
import type { AvatarId } from "@/game/types";

const PORTRAITS: Record<AvatarId, string> = {
  mulher: womanPortrait,
  homem: manPortrait,
  mistico: mysticPortrait,
};

/** Mostra o avatar em 3D só no navegador; no servidor exibe um cartão estático. */
export function AvatarView({
  avatar,
  className = "",
  spin = true,
  interactive = false,
}: {
  avatar: AvatarId;
  className?: string;
  spin?: boolean;
  interactive?: boolean;
}) {
  const option = getAvatar(avatar);

  return (
    <div
      className={`avatar-stage relative overflow-hidden rounded-lg border border-border bg-background ${className}`}
    >
      <img
        src={PORTRAITS[avatar]}
        alt={`${option.name}, avatar 3D de corpo inteiro`}
        width={1024}
        height={1536}
        loading="lazy"
        className={`avatar-premium-render h-full w-full object-contain ${spin ? "avatar-breathe" : ""} ${interactive ? "avatar-interactive" : ""}`}
      />
      <div className="avatar-light pointer-events-none absolute inset-0" aria-hidden="true" />
    </div>
  );
}
