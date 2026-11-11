import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [react()],
    server: {
      host: true, port: 5278,
      proxy: { "/api": env.API_PROXY_TARGET || "http://127.0.0.1:8112" },
    },
  };
});
