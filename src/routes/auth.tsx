import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { LoginPanel } from "@/components/game/LoginPanel";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — PDI QUEST" },
      { name: "description", content: "Entre com sua conta Google para retomar sua jornada no PDI QUEST." },
      { property: "og:title", content: "Entrar — PDI QUEST" },
      { property: "og:description", content: "Sua jornada de desenvolvimento fica salva na sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthScreen,
});

function AuthScreen() {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) void navigate({ to: "/", replace: true });
  }, [session, navigate]);

  return <LoginPanel />;
}
