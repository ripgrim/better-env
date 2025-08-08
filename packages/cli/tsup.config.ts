import { defineConfig } from "tsup";

export default defineConfig({
  banner: { js: "#!/usr/bin/env node" },
  format: "esm",
  target: "esnext",
  dts: true,
  clean: true,
  sourcemap: true,
  minify: true,
  entry: ["src/index.ts"],
  outDir: "dist",
});
