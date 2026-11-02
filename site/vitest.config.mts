import { fileURLToPath } from "node:url";
import { compile } from "@mdx-js/mdx";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vitest/config";

/**
 * Compiles .mdx the way @next/mdx does (components come from
 * src/mdx-components.tsx), so tests can render real case-study bodies.
 */
function mdx(): Plugin {
  return {
    name: "mdx",
    enforce: "pre",
    async transform(source, id) {
      if (!id.endsWith(".mdx")) return null;
      const code = await compile(source, {
        jsx: false,
        providerImportSource: fileURLToPath(
          new URL("./src/mdx-components.tsx", import.meta.url),
        ),
        development: false,
      });
      return { code: String(code), map: null };
    },
  };
}

export default defineConfig({
  plugins: [mdx(), react()],
  resolve: {
    // Resolves the "@/*" alias from tsconfig.json (replaces vite-tsconfig-paths).
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: {
      modules: {
        classNameStrategy: "non-scoped",
      },
    },
  },
});
