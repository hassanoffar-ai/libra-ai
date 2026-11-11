import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/lib/firebase/auth-context";

export const metadata: Metadata = {
  title: "Peşə Kitabxanası - Lənkəran Dövlət Peşə Təhsil Mərkəzi",
  description:
    "Lənkəran Dövlət Peşə Təhsil Mərkəzi üçün Peşə Kitabxanası İdarəetmə Sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="az">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}

