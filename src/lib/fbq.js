export function track(event, data = {}, eventID, intentos = 0) {
  if (typeof window === 'undefined') return
  if (typeof window.fbq !== 'function') {
    if (intentos < 20) setTimeout(() => track(event, data, eventID, intentos + 1), 250)
    return
  }
  if (eventID) window.fbq('track', event, data, { eventID })
  else window.fbq('track', event, data)
}