import { assetUrl } from "@/lib/asset-url";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import welcomeArtwork from "@/assets/gk-airwin-global-aviator.png.asset.json";
import { Plane } from "./Plane";
import { usePlayerLanguage } from "./PlayerLanguage";

export function WelcomeScreen() {
  const { t } = usePlayerLanguage();

  return (
    <main dir="ltr" className="welcome-screen bg-air-page text-air-text">
      <h1 className="sr-only">GK Airwin Aviator — One World. One Game.</h1>

      <div className="welcome-backdrop" aria-hidden="true">
        <img src={assetUrl(welcomeArtwork.url)} alt="" />
      </div>

      <div className="welcome-artwork-wrap" aria-hidden="true">
        <img
          src={assetUrl(welcomeArtwork.url)}
          alt=""
          className="welcome-artwork"
          fetchPriority="high"
        />
      </div>

      <div className="welcome-atmosphere" aria-hidden="true" />
      <div className="welcome-stars welcome-stars-near" aria-hidden="true" />
      <div className="welcome-stars welcome-stars-far" aria-hidden="true" />

      <svg
        className="welcome-flight text-air-brand"
        viewBox="0 0 1215 1295"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          className="welcome-flight-glow"
          pathLength="1"
          d="M -80 1040 C 220 1110 320 860 570 785 C 810 712 965 575 1290 280"
        />
        <path
          className="welcome-flight-line"
          pathLength="1"
          d="M -80 1040 C 220 1110 320 860 570 785 C 810 712 965 575 1290 280"
        />
      </svg>

      <div className="welcome-plane" aria-hidden="true">
        <Plane className="h-auto w-full" />
      </div>

      <div className="welcome-shade" aria-hidden="true" />

      <div className="welcome-action">
        <p className="welcome-action-kicker">THE WORLD IS YOURS</p>
        <Link
          to="/auth"
          className="welcome-cta"
          aria-label={`${t("signin")} / ${t("register")}`}
        >
          <span className="welcome-cta-main">
            TAKE FLIGHT
            <ArrowRight className="welcome-cta-arrow" strokeWidth={2.5} />
          </span>
          <span className="welcome-cta-sub">
            {t("signin")} <span aria-hidden="true">•</span> {t("register")}
          </span>
        </Link>
      </div>
    </main>
  );
}
