import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

export default defineConfig(
  {
    languageOptions: {
      globals: {
        ...globals.node
      },
    },
		extends: [
			eslint.configs.recommended,
    ],
    rules: {
      'eol-last': 'error',
      'no-trailing-spaces': 'error',
    },
  }
);
