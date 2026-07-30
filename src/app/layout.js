import { CarritoProvider } from '@/lib/carrito'
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
          {children}
        </CarritoProvider>
      </body>
    </html>
  )
}