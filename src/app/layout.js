import { CarritoProvider } from '@/lib/carrito'
import Header from './Header'
import './globals.css'
import FloatingWhatsApp from './FloatingWhatsApp'
import Footer from './Footer'

export const metadata = {
  // Dirección oficial: Google la usa como base para todas las direcciones del sitio
  metadataBase: new URL('https://www.dimedetiambos.com.ar'),
  title: {
    default: 'Dimedeti Ambos | Ambos médicos y sanitarios',
    template: '%s | Dimedeti Ambos',
  },
  description:
    'Ambos médicos y sanitarios confeccionados a pedido. Elegí tu talle y color y recibilo en todo el país.',
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
          <Footer />
        </CarritoProvider>
      </body>
    </html>
  )
}