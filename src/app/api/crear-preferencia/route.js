// DESTINO: src/app/api/crear-preferencia/route.js  (reemplaza el archivo actual)
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { NextResponse } from 'next/server'
import { calcularCostoEnvio } from '@/lib/configEnvioGratis'
import {
  validarCuponParaPedido,
  usarCupon,
  devolverUsoCupon,
  repartirDescuentoEnItems,
  usuarioDesdeRequest,
  MENSAJE_LOGIN,
} from '@/lib/cupones'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
})

async function verificarRecaptcha(token) {
  if (!token) return false

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    })

    const data = await res.json()

    // score va de 0 (bot) a 1 (humano). 0.5 es el umbral recomendado por Google.
    return data.success && data.score >= 0.5 && data.action === 'checkout'
  } catch (error) {
    console.error('Error al verificar reCAPTCHA:', error)
    return false
  }
}

export async function POST(request) {
  // Si el pago no se llega a crear, se devuelve el uso del cupón que se había reservado
  let cuponReservado = null

  try {
    const { items, zonaEnvio, datosCliente, recaptchaToken, cuponCodigo } = await request.json()

    const recaptchaValido = await verificarRecaptcha(recaptchaToken)
    if (!recaptchaValido) {
      return NextResponse.json(
        { error: 'No pudimos verificar que sos una persona real. Recargá la página e intentá de nuevo.' },
        { status: 400 }
      )
    }

    const subtotalProductos = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0)

    // Cupón: se valida y se calcula acá, nunca se confía en el descuento que manda el navegador.
    // Para usar un cupón hay que haber ingresado con Google.
    let cupon = null
    let descuentoCupon = 0
    let usuario = null

    if (cuponCodigo) {
      usuario = await usuarioDesdeRequest(request)
      if (!usuario) {
        return NextResponse.json(
          { error: MENSAJE_LOGIN, cupon_invalido: true, login_requerido: true },
          { status: 401 }
        )
      }

      const validacion = await validarCuponParaPedido(cuponCodigo, subtotalProductos, usuario.id)
      if (!validacion.ok) {
        return NextResponse.json({ error: validacion.error, cupon_invalido: true }, { status: 400 })
      }
      if (validacion.descuento >= subtotalProductos) {
        return NextResponse.json(
          { error: 'Este cupón cubre todo el pedido y no se puede usar con Mercado Pago. Escribinos y lo resolvemos.', cupon_invalido: true },
          { status: 400 }
        )
      }

      const reservado = await usarCupon(validacion.cupon.codigo)
      if (!reservado) {
        return NextResponse.json(
          { error: 'El cupón no es válido o ya no está disponible.', cupon_invalido: true },
          { status: 400 }
        )
      }

      cuponReservado = validacion.cupon.codigo
      cupon = validacion.cupon
      descuentoCupon = validacion.descuento
    }

    const preference = new Preference(client)

    const itemsParaMP = items.map((item) => {
      const detalles = [item.color, item.talle ? `Talle ${item.talle}` : null]
        .filter(Boolean)
        .join(' - ')

      return {
        id: String(item.id),
        title: detalles ? `${item.nombre} (${detalles})` : item.nombre,
        quantity: item.cantidad,
        unit_price: item.precio,
        currency_id: 'ARS',
      }
    })

    // Mercado Pago no acepta líneas con precio negativo: el descuento del cupón se reparte
    // entre los precios de los productos (el total queda correcto)
    const itemsConCupon = repartirDescuentoEnItems(itemsParaMP, descuentoCupon)

    // Envío gratis desde cierto monto (medido después del cupón): el costo se recalcula acá,
    // no se confía en el del navegador
    const subtotalConCupon = subtotalProductos - descuentoCupon
    const costoEnvio = calcularCostoEnvio(subtotalConCupon, zonaEnvio)

    if (zonaEnvio && costoEnvio > 0) {
      itemsConCupon.push({
        id: 'envio',
        title: `Envío - ${zonaEnvio.nombre}`,
        quantity: 1,
        unit_price: costoEnvio,
        currency_id: 'ARS',
      })
    }

    // Guardamos también los items originales (con imagen_url) en metadata,
    // porque Mercado Pago no permite campos custom dentro de "items".
    const itemsOriginales = items.map((item) => ({
      nombre: item.nombre,
      color: item.color || null,
      talle: item.talle || null,
      imagen_url: item.imagen_url || null,
    }))

    const resultado = await preference.create({
      body: {
        items: itemsConCupon,
        payer: {
          name: datosCliente?.nombre,
          email: datosCliente?.email,
        },
        metadata: {
          datos_cliente: datosCliente,
          zona_envio: zonaEnvio ? { ...zonaEnvio, costo: costoEnvio } : null,
          items_originales: itemsOriginales,
          cupon: cupon ? { codigo: cupon.codigo, descuento: descuentoCupon } : null,
          // Quién usó el cupón: al aprobarse el pago, el webhook lo anota en esa cuenta
          usuario_id: usuario ? usuario.id : null,
        },
        back_urls: {
          success: 'https://www.dimedetiambos.com.ar/pago-exitoso',
          failure: 'https://www.dimedetiambos.com.ar/pago-fallido',
          pending: 'https://www.dimedetiambos.com.ar/pago-pendiente',
        },
        auto_return: 'approved',
        notification_url: 'https://www.dimedetiambos.com.ar/api/webhook-mercadopago',
      },
    })

    return NextResponse.json({ id: resultado.id, init_point: resultado.init_point })
  } catch (error) {
    console.error('Error al crear preferencia:', error)
    if (cuponReservado) await devolverUsoCupon(cuponReservado)
    return NextResponse.json({ error: 'Error al crear la preferencia de pago' }, { status: 500 })
  }
}