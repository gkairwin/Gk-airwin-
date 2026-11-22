import { createFileRoute } from "@tanstack/react-router";
import { WelcomeScreen } from "@/components/aviator/WelcomeScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GK Airwin Aviator — One World. One Game." },
      {
        name: "description",
        content:
          "Experience GK Airwin Aviator, a worldwide crash-game adventure. Sign in or create your account and take flight.",
      },
      { property: "og:title", content: "GK Airwin Aviator — One World. One Game." },
      {
        property: "og:description",
        content:
          "Experience GK Airwin Aviator, a worldwide crash-game adventure. Sign in or create your account and take flight.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  return <WelcomeScreen />;
}
