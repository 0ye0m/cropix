import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ThemeProvider } from "../components/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Cropix - Smart Crop Recommendations",
  description: "Find the best crops for your soil and environment with Cropix",
  generator: "cropix.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>

        {/* Google Translate Button */}
        <div id="google_translate_element" style={{ position: "fixed", top: 10, right: 10, zIndex: 9999 }}></div>

        {/* Google Translate Script */}
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement(
                {
                  pageLanguage: 'en',
                  includedLanguages: 'hi',
                  layout: google.translate.TranslateElement.InlineLayout.SIMPLE
                },
                'google_translate_element'
              );
            }
          `}
        </Script>

        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
        </ThemeProvider>

      </body>
    </html>
  )
}