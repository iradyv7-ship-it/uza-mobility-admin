import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  {
    rules: {
      /*
       * The React Compiler rules, deliberately at `warn` rather than `error`.
       *
       * These arrived with React 19 and flag patterns that pre-date them — chiefly
       * `setState` called synchronously inside an effect, which causes a second render
       * pass. Several components in this application do it. They are worth fixing.
       *
       * They are NOT worth fixing all at once, blind, in an application that is serving
       * real customers at the admin panel. Each one needs its component understood and
       * its behaviour re-checked, and a batch rewrite of fourteen hooks is how a live
       * site breaks.
       *
       * So: visible on every run, tracked, and burned down deliberately — but not
       * blocking the pipeline on day one. Raise each of these to `error` as the last
       * offender in that category is fixed, which makes the ratchet one-way.
       *
       * Reviewed 30 August 2026. If this comment is more than a few months old and the
       * warning count has not moved, that is the finding.
       */
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/refs': 'warn',

      /*
       * Unused variables are a warning here rather than an error because this project
       * uses the `_name` discard convention in places and the shared Next config does
       * not know about it. Everything genuinely dead has been removed; what remains is
       * intentional.
       */
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]);

export default eslintConfig;
