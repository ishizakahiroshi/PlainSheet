import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/PlainSheet/" : "/",
  plugins: [react()],
  clearScreen: false,
  server: {
    // Bind to loopback only. The dev server has no authentication, and on
    // Windows a `server.fs.deny` bypass (GHSA-fx2h-pf6j-xcff, unpatched in the
    // vite 5 line) lets anyone who can reach it read files outside the project.
    // Tauri connects over http://localhost:1420 (`devUrl`), so nothing here
    // needs the server to listen on other interfaces. Do not add --host.
    host: "127.0.0.1",
    port: 1420,
    strictPort: false,
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "es2022",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: Boolean(process.env.TAURI_DEBUG),
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/tests/**/*.test.ts", "src/tests/**/*.test.tsx"],
    setupFiles: ["src/tests/setup.ts"],
  },
});
