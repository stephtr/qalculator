import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: "Qalculator v2",
  description: "Calculating the awesome way",
  icons: [
    { rel: 'icon', url: '/logo.png' }
  ]
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
        <div className="w-[90vw] max-w-4xl text-xl mx-auto text-center flex flex-col w-[calc(100vw_-_2_*_max(env(safe-area-inset-right),env(safe-area-inset-left),5vw))]">
          <Link href="/">
            <h1 className="pt-[max(min(20px,2vh),env(safe-area-inset-top))] pb-[min(20px,2vh)]">
              Qalculator.xyz
            </h1>
          </Link>
          {children}
        </div>
      </body>
    </html>
  );
}
