import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { peerDependencies } from "./package.json";
import react from "@vitejs/plugin-react";
import preserveUseClientDirective from "rollup-plugin-preserve-use-client";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: "./lib/index.ts",
        server: "./lib/server/index.ts",
      },
      name: "@wacht/react-router",
      formats: ["cjs", "es"],
    },
    rollupOptions: {
      external: [...Object.keys(peerDependencies), "react/jsx-runtime", "@wacht/backend"],
      plugins: [preserveUseClientDirective()],
      output: {
        globals: {
          react: "React",
          "react/jsx-runtime": "jsxRuntime",
          "react-router-dom": "ReactRouterDOM",
          "@wacht/jsx": "Wacht",
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  plugins: [react(), dts()],
  resolve: {
    alias: {
      "@": "/lib",
    },
  },
  define: {
    "import.meta": "import.meta",
  },
});
