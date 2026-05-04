import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? 'app://web-dist/' : '/',
  build: {
    outDir: '../electron/web-dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': '/src',

      'views': '/src/views',
      'config': '/src/config',
    },
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'webview'
        }
      }
    })
  ],
}))
