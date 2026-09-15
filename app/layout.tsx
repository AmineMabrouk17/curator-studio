import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://curator-studio.cast-cue.workers.dev"),
  title: {
    default: "CuratorStudio",
    template: "%s · CuratorStudio",
  },
  description:
    "A personal video knowledge studio and digital library.",
  icons: {
    icon: "/brand/favicon-32.png",
    shortcut: "/brand/favicon-32.png",
    apple: "/brand/favicon-32.png",
  },
  openGraph: {
    title: "CuratorStudio",
    description: "A personal video knowledge studio and digital library.",
    images: ["/brand/logo-light-panel.png"],
  },
};

const themeScript = `
try {
  var t = localStorage.getItem('theme');
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        {children}
      </body>
    </html>
  );
}