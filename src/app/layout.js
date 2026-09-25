import { CarritoProvider } from '@/lib/carrito'
import Header from './Header'
import './globals.css'
import FloatingWhatsApp from './FloatingWhatsApp'

export const metadata = {
  title: 'Mi Tienda',
  description: 'Tienda online',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Dimedeti Admin',
  },
}

export const viewport = {
  themeColor: '#47494e',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <CarritoProvider>
          <Header />
          {children}
          <FloatingWhatsApp />
        </CarritoProvider>
      </body>
    </html>
  )
}