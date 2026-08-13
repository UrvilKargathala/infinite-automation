/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-barlow)", "system-ui", "sans-serif"],
      },
      fontWeight: {
        light: "300",
        normal: "400",
      },
      colors: {
        brand: {
          blue: "#3A90C3",
          green: "#44BE4A",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F9FAFB",
        },
        border: {
          DEFAULT: "#E5E7EB",
          strong: "#D1D5DB",
        },
        text: {
          primary: "#0F172A",
          secondary: "#64748B",
          muted: "#94A3B8",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
        purple: "#8B5CF6",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(90deg, #3A90C3 0%, #44BE4A 100%)",
        "brand-gradient-diag":
          "linear-gradient(135deg, #3A90C3 0%, #44BE4A 100%)",
        "brand-gradient-tint":
          "linear-gradient(90deg, #3A90C310 0%, #44BE4A10 100%)",
      },
      boxShadow: {
        card: "0 2px 8px -2px rgba(15, 23, 42, 0.06), 0 4px 16px -4px rgba(15, 23, 42, 0.04)",
        cardHover:
          "0 4px 16px -4px rgba(15, 23, 42, 0.10), 0 8px 32px -8px rgba(15, 23, 42, 0.06)",
        modal: "0 24px 48px -12px rgba(15, 23, 42, 0.18)",
        dropdown: "0 8px 24px -8px rgba(15, 23, 42, 0.12)",
        iconBtn: "0 1px 3px 0 rgba(15, 23, 42, 0.05)",
        drag: "0 12px 32px -8px rgba(58, 144, 195, 0.25)",
      },
      borderRadius: {
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
