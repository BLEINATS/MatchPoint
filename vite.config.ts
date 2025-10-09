import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Detecta automaticamente o ambiente
const isReplit = Boolean(process.env.REPL_SLUG || process.env.REPL_ID);
const allowAllHosts = isReplit || process.env.VITE_ALLOW_ALL_HOSTS === "1";
const extraHosts = (process.env.VITE_ALLOWED_HOSTS ?? "").split(",").map(s => s.trim()).filter(Boolean);

// Configuração segura por padrão, permissiva apenas quando necessário
const allowedHosts = allowAllHosts 
  ? true 
  : ["localhost", "127.0.0.1", "::1", ...extraHosts];

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    // A opção hmr: false foi removida.
    // Adicionado 'watch' com 'usePolling' para maior estabilidade em ambientes containerizados.
    watch: {
      usePolling: true,
    },
    allowedHosts
  }
});
