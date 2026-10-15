// Le dice a Google qué páginas no tiene que mirar (administración, pagos, API).
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/checkout',
          '/pago-exitoso',
          '/pago-fallido',
          '/pago-pendiente',
          '/pago-transferencia',
        ],
      },
    ],
    sitemap: 'https://www.dimedetiambos.com.ar/sitemap.xml',
  }
}