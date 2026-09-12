import { Link, createFileRoute } from "@tanstack/react-router";
import titleArt from "@/assets/pdi-world-title.jpg";
import { TOTAL_QUESTIONS, TOTAL_XP } from "@/game/data";
import { useGame } from "@/game/state";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PDI QUEST — RPG de desenvolvimento em design" },
      {
        name: "description",
        content:
          "Explore o Vale de Aurora, cumpra missões de aprendizado e evolua seu personagem no PDI QUEST, o RPG do plano de desenvolvimento de design.",
      },
      { property: "og:title", content: "PDI QUEST — RPG de desenvolvimento em design" },
      {
        property: "og:description",
        content: "Um mundo explorável com 48 missões, 480 desafios e 20 níveis de progressão.",
      },
    ],
  }),
  component: TitleScreen,
});

function TitleScreen() {
  const { save, hydrated } = useGame();
  const hasSave = hydrated && !!save.player;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <img
        src={titleArt}
        alt="Vale, floresta e montanhas do mundo do PDI QUEST ao amanhecer"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-xs tracking-[0.35em] text-primary uppercase">Jornada de design</p>
        <h1 className="mt-4 font-display text-5xl text-parchment sm:text-7xl">PDI QUEST</h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          O mundo do ofício se abre em quatro territórios. Cada material de estudo é uma missão real,
          cada acerto é experiência conquistada, e a Torre Silente espera quem chegar ao fim.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          {hasSave ? (
            <>
              <Link
                to="/world"
                className="rounded-md bg-primary px-7 py-3 font-display text-lg text-primary-foreground transition-opacity hover:opacity-90"
              >
                Continuar jornada
              </Link>
              <Link
                to="/profile"
                className="rounded-md border border-border px-7 py-3 font-display text-lg text-foreground transition-colors hover:bg-secondary"
              >
                Ver personagem
              </Link>
            </>
          ) : (
            <Link
              to="/character"
              className="rounded-md bg-primary px-7 py-3 font-display text-lg text-primary-foreground transition-opacity hover:opacity-90"
            >
              Começar aventura
            </Link>
          )}
        </div>

        <dl className="mt-12 grid w-full grid-cols-3 gap-3 text-sm">
          {[
            { label: "Missões", value: "48" },
            { label: "Desafios", value: String(TOTAL_QUESTIONS) },
            { label: "XP no mundo", value: TOTAL_XP.toLocaleString("pt-BR") },
          ].map((item) => (
            <div key={item.label} className="quest-panel rounded-lg px-3 py-4">
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
              <dd className="font-display text-2xl text-primary">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
