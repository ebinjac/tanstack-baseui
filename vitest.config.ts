import react from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/routeTree.gen.ts",
        "src/styles.css",
        "src/router.tsx",
      ],
    },
  },
});
