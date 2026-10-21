import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// In `npm run dev`, /api/udyam/* goes to the deployed udyamVerify function, so the report flow
// works locally exactly as on the live site (real Cashfree lookups and payments). To use the
// Firebase emulator instead (`firebase emulators:start --only functions,database`), set
// UDYAM_FUNCTION_URL=http://127.0.0.1:5001/pcred-ai-website/asia-south1/udyamVerify
// In production, Firebase Hosting rewrites the same paths to the function (firebase.json).
const FUNCTION_URL = new URL(
  process.env.UDYAM_FUNCTION_URL ?? 'https://asia-south1-pcred-ai-website.cloudfunctions.net/udyamVerify',
)
const udyamApi = Object.fromEntries(
  ['verify', 'checkout', 'unlock', 'otp/send', 'otp/verify', 'certificate', 'lead'].map((path) => [
    `/api/udyam/${path}`,
    {
      target: FUNCTION_URL.origin,
      changeOrigin: true,
      rewrite: () => `${FUNCTION_URL.pathname}/${path}`,
      // The function refuses browser calls from other sites; these come from this dev server
      configure: (proxy) => proxy.on('proxyReq', (request) => request.removeHeader('origin')),
    },
  ]),
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: udyamApi,
  },
})
