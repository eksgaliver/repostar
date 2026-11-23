/**
 * Tailwind v4 lewat PostCSS standar.
 *
 * Sebelumnya ngikut template: loader `@tailwindcss/turbopack` dipasang untuk
 * SEMUA `*.css`, sehingga Tailwind ikut mem-parse CSS module Arc dan gagal pada
 * `:global(...)`. Dengan PostCSS, hanya `globals.css` yang diurus Tailwind dan
 * CSS module diproses css-loader (yang memang paham `:global`).
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;