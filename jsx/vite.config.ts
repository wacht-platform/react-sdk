import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { peerDependencies } from "./package.json";
import react from "@vitejs/plugin-react";
import preserveUseClientDirective from "rollup-plugin-preserve-use-client";

export default defineConfig({
	build: {
		lib: {
			entry: "./lib/index.ts",
			name: "@wacht/react",
			fileName: (format) => `index.${format}.js`,
			formats: ["cjs", "es"],
		},
		rollupOptions: {
			external: [...Object.keys(peerDependencies), "react/jsx-runtime"],
			plugins: [preserveUseClientDirective()],
			output: {
				globals: {
					react: "React",
					"react/jsx-runtime": "jsxRuntime",
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
