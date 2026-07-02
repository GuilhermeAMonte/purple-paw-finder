import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Remove console/debugger do bundle de produção (evita vazamento de
  // informação em diagnósticos e reduz superfície de info-disclosure).
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
