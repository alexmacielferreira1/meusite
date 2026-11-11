import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// No Node 25+ o localStorage nativo conflita com o jsdom; desligar mantém os testes iguais no Node 22/24 do CI.
const nodeMajor = Number(process.versions.node.split(".")[0]);

export default defineConfig({
  plugins: [react()],
  test: {
    // Testes que carregam o ExcelJS passam de 15 s em máquina carregada.
    testTimeout: 30000,
    // Cobertura medida só no código das telas (src/), sem os próprios testes.
    coverage: { provider: "v8", include: ["src/**/*.{ts,tsx}"], exclude: ["src/**/*.test.*", "src/test-file-polyfill.ts", "src/vite-env.d.ts"], reporter: ["text-summary", "json-summary"] },
    execArgv: nodeMajor >= 25 ? ["--no-experimental-webstorage"] : [],
  },
});
