import { CarritoProvider } from '@/lib/carrito'
import Header from './Header'
import './globals.css'
import FloatingWhatsApp from './FloatingWhatsApp'
import FloatingLogo from './FloatingLogo'
import Footer from './Footer'

export const metadata = {
  title: 'Mi Tienda',
  description: 'Tienda online',
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
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
          <FloatingLogo />
          <Footer />
        </CarritoProvider>
      </body>
    </html>
  )
}