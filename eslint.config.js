import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // Cloud Functions and build scripts run in Node, not the browser
  {
    files: ['functions/**/*.js', 'scripts/**/*.{js,mjs}', 'vite.config.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  // Ported as-is from pcred-udyam-system (tested there); kept close to the original so the
  // monthly rule updates and fixes can be copied across, so style-only rules are relaxed here
  {
    files: ['functions/udyam/**/*.js', 'src/udyam/**/*.{js,jsx}'],
    rules: {
      'no-useless-assignment': 'off',
      'no-useless-escape': 'off',
      'no-control-regex': 'off',
      'no-unused-vars': ['error', { varsIgnorePattern: '^(clone|_)', args: 'none', caughtErrors: 'none' }],
      'react-refresh/only-export-components': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
