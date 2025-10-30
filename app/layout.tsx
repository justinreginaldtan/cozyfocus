import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CozyFocus",
  description: "A cozy shared space for gentle real-time collaboration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
