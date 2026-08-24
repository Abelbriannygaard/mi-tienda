'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const CarritoContext = createContext()

const CLAVE_ITEMS = 'dimedetiambos_carrito_items'
const CLAVE_ZONA = 'dimedetiambos_zona_envio'

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([])
  const [zonaEnvio, setZonaEnvio] = useState(null)
  const [cargado, setCargado] = useState(false)

  // Al montar en el navegador, recuperar lo guardado
  useEffect(() => {
    try {
      const itemsGuardados = localStorage.getItem(CLAVE_ITEMS)
      const zonaGuardada = localStorage.getItem(CLAVE_ZONA)

      if (itemsGuardados) setItems(JSON.parse(itemsGuardados))
      if (zonaGuardada) setZonaEnvio(JSON.parse(zonaGuardada))
    } catch (err) {
      console.error('Error al leer el carrito guardado:', err)
    } finally {
      setCargado(true)
    }
  }, [])

  // Guardar items cada vez que cambian (una vez que ya se cargó lo inicial)
  useEffect(() => {
    if (!cargado) return
    try {
      localStorage.setItem(CLAVE_ITEMS, JSON.stringify(items))
    } catch (err) {
      console.error('Error al guardar el carrito:', err)
    }
  }, [items, cargado])

  // Guardar zona de envío cada vez que cambia
  useEffect(() => {
    if (!cargado) return
    try {
      if (zonaEnvio) {
        localStorage.setItem(CLAVE_ZONA, JSON.stringify(zonaEnvio))
      } else {
        localStorage.removeItem(CLAVE_ZONA)
      }
    } catch (err) {
      console.error('Error al guardar la zona de envío:', err)
    }
  }, [zonaEnvio, cargado])

  function agregarAlCarrito(producto, cantidad = 1) {
    setItems((prev) => {
      const existe = prev.find(
        (item) => item.id === producto.id && item.variante_id === producto.variante_id
      )
      if (existe) {
        return prev.map((item) =>
          item.id === producto.id && item.variante_id === producto.variante_id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        )
      }
      return [...prev, { ...producto, cantidad }]
    })
  }

  function quitarDelCarrito(id, varianteId) {
    setItems((prev) =>
      prev.filter((item) => !(item.id === id && item.variante_id === varianteId))
    )
  }

  function actualizarCantidad(id, varianteId, nuevaCantidad) {
    if (nuevaCantidad < 1) {
      quitarDelCarrito(id, varianteId)
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.variante_id === varianteId
          ? { ...item, cantidad: nuevaCantidad }
          : item
      )
    )
  }

  function vaciarCarrito() {
    setItems([])
    setZonaEnvio(null)
  }

  async function pagar(datosCliente, recaptchaToken) {
    const respuesta = await fetch('/api/crear-preferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, zonaEnvio, datosCliente, recaptchaToken }),
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
    <CarritoContext.Provider
      value={{
        items,
        agregarAlCarrito,
        quitarDelCarrito,
        actualizarCantidad,
        vaciarCarrito,
        total,
        totalProductos,
        costoEnvio,
        cantidadTotal,
        pagar,
        zonaEnvio,
        setZonaEnvio,
      }}
    >
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  return useContext(CarritoContext)
}