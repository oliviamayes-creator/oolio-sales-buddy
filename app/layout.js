export const metadata = {
  title: "Oolio Onboard",
  description: "Sales onboarding platform for Oolio Group",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Oolio Onboard",
  },
  icons: {
    icon: [{ url: "/favicon.png", sizes: "64x64", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#673AB6",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@600;700&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Oolio Onboard" />
        <style>{`
          *,*::before,*::after { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; height: 100%; -webkit-font-smoothing: antialiased; }
          body {
            font-family: 'DM Sans', system-ui, sans-serif;
            background: #FAF8FC; color: #1a1a2e;
            overscroll-behavior: none;
            text-rendering: optimizeLegibility;
          }
          input, textarea, button { font-family: inherit; }
          button { -webkit-tap-highlight-color: transparent; cursor: pointer; }
          a { color: inherit; }
          ::-webkit-scrollbar { width: 5px; height: 5px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(103,58,182,0.15); border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(103,58,182,0.3); }
          ::selection { background: rgba(103,58,182,0.2); }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
          @media (max-width: 600px) {
            input, textarea, select { font-size: 16px !important; }
          }
          /* Touch target minimum on mobile */
          @media (max-width: 600px) {
            button { min-height: 36px; }
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
