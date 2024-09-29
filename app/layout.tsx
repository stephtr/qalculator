import type { Metadata } from "next";
import "./globals.css";

export const runtime = 'edge';

export const metadata: Metadata = {
  title: "Qalculator v2",
  description: "Calculating the awesome way",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <meta name="color-scheme" content="dark" />
      <body>
        {children}
      </body>
    </html>
  );
}
