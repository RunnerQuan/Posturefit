import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const cozeEndpoint = env.VITE_COZE_ENDPOINT || 'https://673q2bg4qj.coze.site/stream_run'
  const cozeUrl = new URL(cozeEndpoint)

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api/coze': {
          target: cozeUrl.origin,
          changeOrigin: true,
          secure: true,
          rewrite: path => path.replace(/^\/api\/coze/, ''),
        },
      },
    },
  }
})
