export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      backdropBlur: {
        glass: "20px",
      },
      colors: {
        glass: "rgba(255,255,255,0.1)",
      },
    },
  },
  plugins: [],
};
