import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@root": resolve(__dirname),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "scripts/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "coverage",
      include: ["src/lib/**/*.ts", "scripts/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.d.ts",
        // React hooks — require DOM/browser, not unit-testable here
        "src/lib/useEventListener.ts",
        "src/lib/useScrollLock.ts",
        // OG image generation — requires satori/sharp, not unit-testable
        "src/lib/generateOgImage.ts",
      ],
    },
  },
});
