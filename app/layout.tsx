import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "LIBRA AI - Ağıllı Kitabxana İdarəetmə Sistemi",
  description:
    "Lənkəran Dövlət Peşə Təhsil Mərkəzi üçün LIBRA AI Ağıllı Kitabxana İdarəetmə Sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="az">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

