import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/lib/firebase/auth-context";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Elektron Kitabxana - Lənkəran Dövlət Peşə Təhsil Mərkəzi",
  description:
    "Lənkəran Dövlət Peşə Təhsil Mərkəzi üçün Elektron Kitabxana İdarəetmə Sistemi",
  icons: {
    icon: "/ldptm-logo.png",
    shortcut: "/ldptm-logo.png",
    apple: "/ldptm-logo.png",
  },
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

