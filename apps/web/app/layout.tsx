import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GlobalLayout } from "../src/components/GlobalLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stratum",
  description: "Design delivery coordination system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GlobalLayout>{children}</GlobalLayout>
      </body>
    </html>
  );
}
