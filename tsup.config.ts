import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    server: 'src/infra/http/server.ts',
    'clear-database': 'clear-database.ts',
  },
  format: ['cjs'],
  splitting: false,
  sourcemap: true,
  outDir: 'build',
  tsconfig: 'tsconfig.json',
});
