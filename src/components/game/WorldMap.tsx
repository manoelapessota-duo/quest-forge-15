import { lazy, Suspense, useEffect, useState } from "react";

const WorldMapScene = lazy(() => import("./WorldMapScene"));

export function WorldMap({ onSelect }: { onSelect: (materialId: string) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="grid aspect-[4/3] min-h-[430px] place-items-center rounded-lg border border-border bg-background text-sm text-muted-foreground">Erguendo o mundo…</div>;
  }

  return (
    <Suspense fallback={<div className="grid aspect-[4/3] min-h-[430px] place-items-center rounded-lg border border-border bg-background text-sm text-muted-foreground">Erguendo o mundo…</div>}>
      <WorldMapScene onSelect={onSelect} />
    </Suspense>
  );
}