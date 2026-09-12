import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import classesArt from "@/assets/pdi-classes.png";
import { CLASSES } from "@/game/data";
import { useGame } from "@/game/state";
import type { ClassId } from "@/game/types";

export const Route = createFileRoute("/character")({
  head: () => ({
    meta: [
      { title: "Criar personagem — PDI QUEST" },
      {
        name: "description",
        content: "Escolha entre Arqueiro, Caçador e Mago e comece sua jornada de desenvolvimento.",
      },
      { property: "og:title", content: "Criar personagem — PDI QUEST" },
      { property: "og:description", content: "Três arquétipos, um mesmo mundo para explorar." },
    ],
  }),
  component: CharacterScreen,
});

function CharacterScreen() {
  const { createPlayer } = useGame();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [classId, setClassId] = useState<ClassId | null>(null);
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("Diga como o mundo deve chamar você.");
    if (!classId) return setError("Escolha um arquétipo para seguir.");
    createPlayer(name, classId);
    navigate({ to: "/prologue" });
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-display text-3xl text-parchment sm:text-4xl">Quem parte em jornada?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Seu arquétipo dá cor à narrativa e ao personagem no mapa. O progresso é o mesmo em todos.
      </p>

      <img
        src={classesArt}
        alt="Ilustração original do Arqueiro, do Caçador e do Mago do PDI QUEST"
        className="mt-6 w-full rounded-xl border border-border object-cover"
      />

      <form onSubmit={submit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="name" className="text-sm text-muted-foreground">
            Nome do personagem
          </label>
          <input
            id="name"
            value={name}
            maxLength={40}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            className="mt-2 w-full rounded-md border border-input bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
            placeholder="Ex.: Manoela do Vale"
          />
        </div>

        <fieldset>
          <legend className="text-sm text-muted-foreground">Arquétipo</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {CLASSES.map((option) => {
              const selected = classId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setClassId(option.id);
                    setError("");
                  }}
                  aria-pressed={selected}
                  className={`quest-panel rounded-xl p-4 text-left transition-colors ${
                    selected ? "border-primary ring-2 ring-primary/60" : "hover:border-primary/60"
                  }`}
                >
                  <span className="text-2xl text-primary">{option.glyph}</span>
                  <p className="mt-2 font-display text-xl text-parchment">{option.name}</p>
                  <p className="text-xs text-primary">{option.tagline}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{option.description}</p>
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          className="rounded-md bg-primary px-6 py-3 font-display text-lg text-primary-foreground transition-opacity hover:opacity-90"
        >
          Seguir para o prólogo
        </button>
      </form>
    </main>
  );
}
