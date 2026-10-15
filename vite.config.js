import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// In `npm run dev`, /api/udyam/* goes to the udyamVerify function in the Firebase emulator
// (`firebase emulators:start --only functions,database`). In production, Firebase Hosting
// rewrites the same paths to the deployed function (firebase.json).
const FUNCTION_EMULATOR_URL =
  process.env.UDYAM_FUNCTION_EMULATOR_URL ?? 'http://127.0.0.1:5001/pcred-ai-website/asia-south1/udyamVerify'
const udyamApi = Object.fromEntries(
  ['verify', 'checkout', 'unlock', 'otp/send', 'otp/verify', 'certificate', 'lead'].map((path) => [
    `/api/udyam/${path}`,
    { target: FUNCTION_EMULATOR_URL, changeOrigin: false, rewrite: () => `/${path}` },
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
