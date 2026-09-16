import { Suspense, lazy, useEffect, useState } from "react";
import { getAvatar } from "@/game/avatars";
import type { AvatarId } from "@/game/types";

const AvatarScene = lazy(() => import("./AvatarScene"));

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const option = getAvatar(avatar);

  return (
    <div
      className={`avatar-stage relative overflow-hidden rounded-lg border border-border bg-background ${className}`}
    >
      {mounted ? (
        <Suspense fallback={<Fallback name={option.name} />}>
          <AvatarScene avatar={avatar} spin={spin} interactive={interactive} />
        </Suspense>
      ) : (
        <Fallback name={option.name} />
      )}
    </div>
  );
}

function Fallback({ name }: { name: string }) {
  return (
    <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
      Preparando {name}…
    </div>
  );
}
