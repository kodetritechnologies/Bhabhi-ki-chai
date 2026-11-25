import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chai Pe Charcha - Chai ki zimmedari, ab tension nahi!",
  description: "Desi Tapri Experience • Smart Duty Rotation • Chai Expense Tracking • Reminders • Calendar",
  icons: {
    icon: [
      { url: '/favicon.ico?v=chai-cup', type: 'image/x-icon' },
      { url: '/icon.png?v=chai-cup', sizes: '192x192', type: 'image/png' },
      { url: '/icon.svg?v=chai-cup', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico?v=chai-cup',
    apple: '/icon.png?v=chai-cup',
  },
};

export const viewport: Viewport = {
  themeColor: "#4A2412",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.ico?v=chai-cup" type="image/x-icon" sizes="any" />
        <link rel="icon" href="/icon.svg?v=chai-cup" type="image/svg+xml" />
        <link rel="icon" href="/icon.png?v=chai-cup" type="image/png" sizes="192x192" />
        <link rel="shortcut icon" href="/favicon.ico?v=chai-cup" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/icon.png?v=chai-cup" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Outfit:wght@300;400;500;600;700;800&family=Patrick+Hand&family=Poppins:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#FBF5E8] text-[#2B211B] antialiased selection:bg-[#F4B52E]/30 selection:text-[#4A2412]">
        {children}
      </body>
    </html>
  );
}
