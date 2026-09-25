self.addEventListener('push', function (event) {
  const datos = event.data ? event.data.json() : {}

  const titulo = datos.titulo || 'Nuevo mensaje'
  const opciones = {
    body: datos.cuerpo || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: datos.url || '/admin/conversaciones' },
  }

  event.waitUntil(self.registration.showNotification(titulo, opciones))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || '/admin/conversaciones'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((listaClientes) => {
      for (const cliente of listaClientes) {
        if (cliente.url.includes('/admin') && 'focus' in cliente) {
          cliente.navigate(url)
          return cliente.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})