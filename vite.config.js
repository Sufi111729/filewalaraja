import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

function rewritePrettyAdmin() {
  return {
    name: "rewrite-pretty-admin-route",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url) {
          next();
          return;
        }
        if (req.url === "/admin") req.url = "/admin-login.html";
        if (req.url === "/users") req.url = "/users.html";
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url) {
          next();
          return;
        }
        if (req.url === "/admin") req.url = "/admin-login.html";
        if (req.url === "/users") req.url = "/users.html";
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const apiTarget = env.VITE_DEV_API_PROXY_TARGET || "http://localhost:8080";

  return {
    plugins: [react(), rewritePrettyAdmin()],
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
          convert: resolve(__dirname, "convert.html"),
          mergePdf: resolve(__dirname, "merge-pdf.html"),
          splitPdf: resolve(__dirname, "split-pdf.html"),
          auth: resolve(__dirname, "auth.html"),
          adminLogin: resolve(__dirname, "admin-login.html"),
          users: resolve(__dirname, "users.html"),
          panEditor: resolve(__dirname, "pan-editor.html"),
          kbEditor: resolve(__dirname, "kb-editor.html"),
          aiImageScaler: resolve(__dirname, "ai-image-scaler.html"),
          documentValidator: resolve(__dirname, "document-validator.html"),
          imageTo50kb: resolve(__dirname, "image-to-50kb.html"),
          imageTo20kb: resolve(__dirname, "image-to-20kb.html"),
          imageTo100kb: resolve(__dirname, "compress-image-100kb.html"),
          panPhoto50kb: resolve(__dirname, "pan-photo-50kb.html"),
          signature20kb: resolve(__dirname, "signature-20kb.html"),
          compressPdfTo300kb: resolve(__dirname, "compress-pdf-to-300kb.html")
        },
        output: {
          manualChunks(id) {
            if (id.includes("/src/features/pdf/exportPdf") || id.includes("\\src\\features\\pdf\\exportPdf")) return "feature-pdf";
            if (!id.includes("node_modules")) return;
            if (id.includes("@tensorflow") || id.includes("body-pix")) return "tf-bodypix";
            if (id.includes("jspdf") || id.includes("html2canvas")) return "vendor-pdf";
            if (id.includes("react-easy-crop")) return "vendor-cropper";
            return "vendor-core";
          }
        }
      }
    }
  };
});
