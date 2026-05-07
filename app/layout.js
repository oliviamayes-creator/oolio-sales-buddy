export const metadata = {
  title: "Oolio Onboard",
  description: "Sales onboarding platform for Oolio Group",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#673AB6",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@600;700&display=swap" rel="stylesheet" />
        <style>{`
          *,*::before,*::after { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; height: 100%; -webkit-font-smoothing: antialiased; }
          body { font-family: 'DM Sans', system-ui, sans-serif; background: #FAF8FC; color: #1a1a2e; overscroll-behavior: none; }
          input, textarea, button { font-family: inherit; }
          button { -webkit-tap-highlight-color: transparent; }
          a { color: inherit; }
          ::-webkit-scrollbar { width: 5px; height: 5px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(103,58,182,0.15); border-radius: 3px; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
          @media (max-width: 600px) {
            input, textarea, select { font-size: 16px !important; } /* prevent iOS zoom */
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
