import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Geist_Mono } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { ExamProvider } from '@/contexts/ExamContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'TOEFL Helper — AI-Powered Writing Practice',
    template: '%s | TOEFL Helper',
  },
  description:
    'Practice TOEFL iBT Writing with AI-powered feedback. Get instant scoring, grammar corrections, vocabulary suggestions, and a polished version of your essay.',
  keywords: ['TOEFL', 'iBT', 'writing practice', 'AI feedback', 'English learning', 'ETS'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AuthProvider>
          <ExamProvider>
            <Header />
            <main className="flex flex-1 flex-col">{children}</main>
            <Footer />
          </ExamProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
