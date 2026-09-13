import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Alkebulan Flow — AI Operations Hub", description: "A focused operations workspace for service businesses." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
