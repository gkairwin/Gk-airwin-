export const assetUrl = (path: string) => {
  if (!path) return "";
  if (path.includes("gk-plane") || path.includes("gk-main-game-plane")) return "/gk-plane.png";
  if (path.includes("gk-topbar")) return "/gk-topbar.png";
  if (path.includes("gk-logo")) return "/gk-logo.png";
  if (path.includes("gk-airwin-global-aviator")) return "/gk-airwin-global-aviator.png";
  if (path.includes("plane-flew-away")) return "/audio/plane-flew-away.mp3";
  if (path.includes("plane-game-start")) return "/audio/plane-game-start.mp3";
  return path;
};
