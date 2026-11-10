import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: { target: "es2022", rollupOptions: { input: { main: "index.html", next: "next/index.html" } } },
});
