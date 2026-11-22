// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Public (browser-safe) backend values baked in so any host (Vercel, plain browser)
// works without configuring env vars. Env vars still override when present.
const PUBLIC_URL = process.env['VITE_SUPABASE_URL'] || "https://lzzgjvjasvjikmpivooj.supabase.co";
const PUBLIC_KEY =
  process.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || "sb_publishable_LRiflYMxJrM7Fil5211fWQ_SevS6wK0";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(PUBLIC_URL),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(PUBLIC_KEY),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify("lzzgjvjasvjikmpivooj"),
    },
  },
});
