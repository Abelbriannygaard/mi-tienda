'use client'
import { createContext, useContext, useState } from 'react'

const CarritoContext = createContext()

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([])
  const [zonaEnvio, setZonaEnvio] = useState(null)

  function agregarAlCarrito(producto) {
    setItems((prev) => {
      const existe = prev.find(
        (item) => item.id === producto.id && item.variante_id === producto.variante_id
      )
      if (existe) {
        return prev.map((item) =>
          item.id === producto.id && item.variante_id === producto.variante_id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }
      return [...prev, { ...producto, cantidad: 1 }]
    })
  }

  function quitarDelCarrito(id) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  async function pagar(datosCliente) {
    const respuesta = await fetch('/api/crear-preferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, zonaEnvio, datosCliente }),
    })

    const datos = await respuesta.json()

    if (datos.init_point) {
      window.location.href = datos.init_point
    } else {
      throw new Error('No se pudo generar el link de pago')
    }
  }

  const totalProductos = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
  const costoEnvio = zonaEnvio ? zonaEnvio.costo : 0
  const total = totalProductos + costoEnvio
  const cantidadTotal = items.reduce((acc, item) => acc + item.cantidad, 0)

  return (
    <CarritoContext.Provider value={{ items, agregarAlCarrito, quitarDelCarrito, total, totalProductos, costoEnvio, cantidadTotal, pagar, zonaEnvio, setZonaEnvio }}>
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  return useContext(CarritoContext)
}