import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const RAILWAY_BACKEND_URL = 'https://telconova-p7f4-back-production.up.railway.app';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    server: {
        host: "::",
        port: 5173,
        // CONFIGURACIÓN DEL PROXY INVERSO
        proxy: {
            '/api': {
                // Redirige todas las peticiones que empiecen por /api
                target: RAILWAY_BACKEND_URL,
                // Necesario para que el backend acepte la petición como si viniera de él mismo
                changeOrigin: true,
                // IMPORTANTE: Asegúrate de que las cabeceras de autorización se pasen correctamente
                secure: true,
                // Reescritura: Asegura que /api/v1/auth sigue siendo /api/v1/auth
                rewrite: (path) => path,
            },
        },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
}));