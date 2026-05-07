export const metadata = {
  title: "Oolio Onboard — Sales Onboarding Platform",
  description: "AI-powered onboarding platform for Oolio sales team",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`* { margin: 0; padding: 0; box-sizing: border-box; } body { overflow: hidden; }`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
