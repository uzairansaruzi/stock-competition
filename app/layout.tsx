import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import Script from "next/script"
import type { ReactNode } from "react"
import "./globals.css"

const THEME_STORAGE_KEY = "theme-preference"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Stock Competition",
  description: "Stock Competition Platform by Uzi",
}

const themeInitializer = `
  (function () {
    try {
      var storageKey = "${THEME_STORAGE_KEY}";
      var storedTheme = window.localStorage.getItem(storageKey);
      var systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var resolved = storedTheme === "light" || storedTheme === "dark" ? storedTheme : systemPrefersDark ? "dark" : "light";

      if (resolved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      document.documentElement.style.colorScheme = resolved;
    } catch (error) {
      console.warn("Unable to determine theme", error);
    }
  })();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Script id="theme-initializer" strategy="beforeInteractive">
          {themeInitializer}
        </Script>
        <ThemeProvider>
          <div className="pointer-events-none fixed right-4 top-4 z-50 md:right-6 md:top-6">
            <div className="pointer-events-auto">
              <ThemeToggle />
            </div>
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
