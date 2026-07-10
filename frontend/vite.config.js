import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
   server: {
    allowedHosts: [
      'pacemaker-squid-helpline.ngrok-free.dev'
    ]
  },
  plugins: [react(), tailwindcss()],
})
