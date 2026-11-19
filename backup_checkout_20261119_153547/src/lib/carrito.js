// DESTINO: src/lib/carrito.js  (reemplaza el archivo actual)
'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { UMBRAL_ENVIO_GRATIS, calcularCostoEnvio } from '@/lib/configEnvioGratis'
import { calcularDescuentoCupon, normalizarCodigo } from '@/lib/configCupones'
import { supabase } from '@/lib/supabase'

const CarritoContext = createContext()

const CLAVE_ITEMS = 'dimedetiambos_carrito_items'
const CLAVE_ZONA = 'dimedetiambos_zona_envio'
const CLAVE_CUPON = 'dimedetiambos_cupon'
const CLAVE_CUPON_PENDIENTE = 'dimedetiambos_cupon_pendiente'
const CLAVE_BIENVENIDA_PROBADA = 'dimedetiambos_bienvenida_probada'

// Cupón de bienvenida (se crea desde el panel admin con este mismo código)
const CODIGO_BIENVENIDA = 'BIENVENIDA5'

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([])
  const [zonaEnvio, setZonaEnvio] = useState(null)
  const [cupon, setCupon] = useState(null)
  const [cargado, setCargado] = useState(false)

  // Sesión con Google
  const [usuario, setUsuario] = useState(null)
  const [sesionLista, setSesionLista] = useState(false)

  // Estado compartido del panel del carrito (abierto / cerrado)
  const [panelAbierto, setPanelAbierto] = useState(false)

  function abrirPanel() {
    setPanelAbierto(true)
  }

  function cerrarPanel() {
    setPanelAbierto(false)
  }

  function alternarPanel() {
    setPanelAbierto((abierto) => !abierto)
  }

  // Al montar en el navegador, recuperar lo guardado
  useEffect(() => {
    try {
      const itemsGuardados = localStorage.getItem(CLAVE_ITEMS)
      const zonaGuardada = localStorage.getItem(CLAVE_ZONA)
      const cuponGuardado = localStorage.getItem(CLAVE_CUPON)

      if (itemsGuardados) setItems(JSON.parse(itemsGuardados))
      if (zonaGuardada) setZonaEnvio(JSON.parse(zonaGuardada))
      if (cuponGuardado) setCupon(JSON.parse(cuponGuardado))
    } catch (err) {
      console.error('Error al leer el carrito guardado:', err)
    } finally {
      setCargado(true)
    }
  }, [])

  // Escuchar la sesión de Google (al entrar, al volver de Google y al salir)
  useEffect(() => {
    let activo = true

    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return
      setUsuario(data.session?.user ?? null)
      setSesionLista(true)
    })

    const { data: suscripcion } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      setUsuario(sesion?.user ?? null)
      setSesionLista(true)
    })

    return () => {
      activo = false
      suscripcion.subscription.unsubscribe()
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

  // Guardar el cupón cada vez que cambia
  useEffect(() => {
    if (!cargado) return
    try {
      if (cupon) {
        localStorage.setItem(CLAVE_CUPON, JSON.stringify(cupon))
      } else {
        localStorage.removeItem(CLAVE_CUPON)
      }
    } catch (err) {
      console.error('Error al guardar el cupón:', err)
    }
  }, [cupon, cargado])

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
    setCupon(null)
  }

  // ---------- Sesión con Google ----------

  async function iniciarSesionGoogle() {
    const volverA = window.location.href.split('#')[0]
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: volverA },
    })
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    setCupon(null)
  }

  // Cabeceras para las llamadas a la API: incluyen la sesión para que el servidor sepa quién es
  async function cabecerasConSesion() {
    const cabeceras = { 'Content-Type': 'application/json' }
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (token) cabeceras.Authorization = `Bearer ${token}`
    } catch (err) {
      console.error('No se pudo leer la sesión:', err)
    }
    return cabeceras
  }

  // Comprueba con el servidor que el cupón exista y esté vigente, y lo deja cargado.
  // Para usar un cupón hay que haber ingresado con Google: si no, se recuerda el código
  // y se aplica solo apenas la persona ingresa.
  // El descuento definitivo se vuelve a calcular en el servidor al pagar.
  async function aplicarCupon(codigo) {
    try {
      const respuesta = await fetch('/api/validar-cupon', {
        method: 'POST',
        headers: await cabecerasConSesion(),
        body: JSON.stringify({ codigo }),
      })
      const datos = await respuesta.json()

      if (respuesta.status === 401 || datos.login_requerido) {
        try {
          localStorage.setItem(CLAVE_CUPON_PENDIENTE, normalizarCodigo(codigo))
        } catch {}
        return {
          ok: false,
          loginRequerido: true,
          error: datos.error || 'Para usar un cupón ingresá con Google.',
        }
      }

      if (!respuesta.ok || !datos.cupon) {
        return { ok: false, error: datos.error || 'No pudimos aplicar el cupón.' }
      }

      setCupon(datos.cupon)
      return { ok: true, cupon: datos.cupon }
    } catch (err) {
      return { ok: false, errorDeRed: true, error: 'No pudimos verificar el cupón. Probá de nuevo.' }
    }
  }

  function quitarCupon() {
    setCupon(null)
  }

  // Apenas la persona ingresa con Google:
  // 1) si había un cupón esperando (ej: venía de un QR), se aplica
  // 2) si no hay ningún cupón puesto, se prueba el de bienvenida (si ya lo usó, no pasa nada)
  useEffect(() => {
    if (!cargado || !sesionLista || !usuario) return

    let pendiente = null
    try {
      pendiente = localStorage.getItem(CLAVE_CUPON_PENDIENTE)
      if (pendiente) localStorage.removeItem(CLAVE_CUPON_PENDIENTE)
    } catch {}

    if (pendiente) {
      aplicarCupon(pendiente)
      return
    }

    if (!cupon) {
      const claveProbada = `${CLAVE_BIENVENIDA_PROBADA}_${usuario.id}`
      let yaProbada = false
      try {
        yaProbada = Boolean(sessionStorage.getItem(claveProbada))
      } catch {}
      if (!yaProbada) {
        aplicarCupon(CODIGO_BIENVENIDA).then((resultado) => {
          // Se marca como probada solo si el servidor contestó de verdad (lo aplicó o lo rechazó).
          // Si falló por red o por falta de sesión, se reintenta la próxima vez.
          if (resultado.ok || (!resultado.loginRequerido && !resultado.errorDeRed)) {
            try {
              sessionStorage.setItem(claveProbada, '1')
            } catch {}
          }
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargado, sesionLista, usuario])

  async function pagar(datosCliente, recaptchaToken) {
    const respuesta = await fetch('/api/crear-preferencia', {
      method: 'POST',
      headers: await cabecerasConSesion(),
      body: JSON.stringify({
        items,
        zonaEnvio,
        datosCliente,
        recaptchaToken,
        cuponCodigo: cupon?.codigo || null,
      }),
    })

    const datos = await respuesta.json()

    if (datos.init_point) {
      window.location.href = datos.init_point
    } else {
      const error = new Error(datos.error || 'No se pudo generar el link de pago')
      error.cuponInvalido = Boolean(datos.cupon_invalido)
      throw error
    }
  }

  const totalProductos = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0)

  // Cupón: descuenta solo los productos y solo si se llega a la compra mínima
  const cuponAplica = Boolean(cupon) && totalProductos >= (Number(cupon.compra_minima) || 0)
  const descuentoCupon = cuponAplica ? calcularDescuentoCupon(cupon, totalProductos) : 0
  const totalProductosConCupon = totalProductos - descuentoCupon

  // Envío gratis desde cierto monto de productos, medido DESPUÉS del cupón (ver configEnvioGratis.js)
  const envioGratis = totalProductosConCupon >= UMBRAL_ENVIO_GRATIS
  const faltaParaEnvioGratis = Math.max(0, UMBRAL_ENVIO_GRATIS - totalProductosConCupon)
  const costoEnvio = calcularCostoEnvio(totalProductosConCupon, zonaEnvio)
  const total = totalProductosConCupon + costoEnvio
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
        totalProductosConCupon,
        costoEnvio,
        envioGratis,
        faltaParaEnvioGratis,
        cantidadTotal,
        pagar,
        zonaEnvio,
        setZonaEnvio,
        cupon,
        cuponAplica,
        descuentoCupon,
        aplicarCupon,
        quitarCupon,
        usuario,
        sesionLista,
        iniciarSesionGoogle,
        cerrarSesion,
        cabecerasConSesion,
        panelAbierto,
        abrirPanel,
        cerrarPanel,
        alternarPanel,
      }}
    >
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  return useContext(CarritoContext)
}