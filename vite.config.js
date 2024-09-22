import checker from 'vite-plugin-checker'
export default {
  plugins: [
    checker({
      typescript: true,
    }),
  ],
    base: "./",
    define: {
        "global": "window"
    }
}
