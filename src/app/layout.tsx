import type { Metadata } from "next";
import "./globals.css";
import { FloatingChat } from "@/components/floating-chat";
import { themeInitScript } from "@/components/theme-toggle";

export const metadata: Metadata = { title: "Alkebulan Flow — AI Operations Hub", description: "A focused operations workspace for service businesses." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}<FloatingChat/></body>
    </html>
  );
}
