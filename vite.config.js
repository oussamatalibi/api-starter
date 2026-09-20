import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFile } from "node:fs/promises";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "mohamed-ali-project-route",
      configureServer(server) {
        server.middlewares.use("/projects/mohamed-ali", async (request, response, next) => {
          if (request.url !== "/" && request.url !== "") {
            next();
            return;
          }

          try {
            const projectIndex = path.resolve(process.cwd(), "public/projects/mohamed-ali/index.html");
            response.setHeader("Content-Type", "text/html; charset=utf-8");
            response.end(await readFile(projectIndex));
          } catch (error) {
            next(error);
          }
        });
      }
    }
  ]
});
