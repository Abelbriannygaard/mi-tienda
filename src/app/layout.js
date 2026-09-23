import { CarritoProvider } from '@/lib/carrito'
import Header from './Header'
import './globals.css'
import FloatingWhatsApp from './FloatingWhatsApp'
import './globals.css'

export const metadata = {
  title: 'Mi Tienda',
  description: 'Tienda online',
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