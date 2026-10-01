export const metadata = {
  title: 'Dimedeti Admin',
  description: 'Panel de administración de Dimedeti Ambos',
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

export default function AdminLayout({ children }) {
  return children
}