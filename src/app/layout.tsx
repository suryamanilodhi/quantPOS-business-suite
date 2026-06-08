import type { Metadata } from "next";
import Script from "next/script";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuantPOS",
  description: "Smooth POS billing and inventory software for retail shops"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script id="quantpos-theme" strategy="beforeInteractive">
        {`
          try {
            var savedTheme = localStorage.getItem("quantpos-theme");
            var theme = savedTheme || "light";
            document.documentElement.classList.toggle("dark", theme === "dark");
            document.documentElement.style.colorScheme = theme;
          } catch (_) {}
        `}
      </Script>
      <body><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
