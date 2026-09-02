/** @type {import('tailwindcss').Config} */
// Tailwind compilado en el build (antes venía del CDN en tiempo de ejecución, que
// fallaba en tablets/redes con filtros y dejaba la página sin estilos).
export default {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './{components,data,lib,services}/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
