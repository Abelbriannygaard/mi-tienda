// DESTINO: src/app/api/crear-pedido-transferencia/route.js  (reemplaza el archivo actual)
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DESCUENTO_TRANSFERENCIA } from '@/lib/configTransferencia'
import { cuponSeSumaConTransferencia } from '@/lib/configDescuentos'
import { calcularCostoEnvio } from '@/lib/configEnvioGratis'
import { nombreLineaCupon } from '@/lib/configCupones'
import {
  validarCuponParaPedido,
  usarCupon,
  devolverUsoCupon,
  usuarioDesdeRequest,
  reservarUsoCuenta,
  liberarUsoCuenta,
  vincularUsoConPedido,
  MENSAJE_LOGIN,
  MENSAJE_YA_USADO,
} from '@/lib/cupones'
import {
  enviarEmailInstruccionesTransferencia,
  enviarEmailNotificacionTransferencia,
} from '@/lib/enviarEmails'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verificarRecaptcha(token) {
  if (!token) return false

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    })

    const data = await res.json()
    return data.success && data.score >= 0.5 && data.action === 'checkout'
  } catch (error) {
    console.error('Error al verificar reCAPTCHA:', error)
    return false
  }
}

export async function POST(request) {
  // Si el pedido no se llega a guardar, se devuelven los usos que se habían reservado
  let cuponReservado = null
  let usoCuentaReservado = null // { userId, codigo }

  async function deshacerReservas() {
    if (cuponReservado) {
      await devolverUsoCupon(cuponReservado)
      cuponReservado = null
    }
    if (usoCuentaReservado) {
      await liberarUsoCuenta(usoCuentaReservado.userId, usoCuentaReservado.codigo)
      usoCuentaReservado = null
    }
  }

  try {
    const { items, zonaEnvio, datosCliente, recaptchaToken, cuponCodigo } = await request.json()

    const recaptchaValido = await verificarRecaptcha(recaptchaToken)
    if (!recaptchaValido) {
      return NextResponse.json(
        { error: 'No pudimos verificar que sos una persona real. Recargá la página e intentá de nuevo.' },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Tu carrito está vacío' }, { status: 400 })
    }
    if (!zonaEnvio) {
      return NextResponse.json({ error: 'Elegí una zona de envío' }, { status: 400 })
    }
    if (!datosCliente?.nombre || !datosCliente?.email) {
      return NextResponse.json({ error: 'Faltan tus datos de contacto' }, { status: 400 })
    }

    // Mismo criterio que crear-preferencia: se toman nombre y precio del carrito.
    // Se limpian cantidad y precio para que no entren valores raros.
    const itemsPedido = items.map((item) => {
      const cantidad = Math.max(1, parseInt(item.cantidad, 10) || 1)
      const precio = Math.max(0, Number(item.precio) || 0)
      const detalles = [item.color, item.talle ? `Talle ${item.talle}` : null].filter(Boolean).join(' - ')

      return {
        nombre: detalles ? `${item.nombre} (${detalles})` : item.nombre,
        cantidad,
        precio,
        imagen_url: item.imagen_url || null,
      }
    })

    const subtotal = itemsPedido.reduce((acc, item) => acc + item.precio * item.cantidad, 0)

    // Cupón + transferencia (las reglas están en src/lib/configDescuentos.js, igual que en el checkout):
    // - Los cupones de bienvenida SE SUMAN: primero se descuenta el cupón y el % de transferencia
    //   se calcula sobre lo que queda (5% + 5% = 9,75%).
    // - Cualquier otro cupón NO se suma: se aplica solo el descuento más alto.
    //   Si empatan, queda el de transferencia y el cupón no se gasta.
    let cupon = null
    let descuentoCupon = 0
    let sumaTransferencia = true // pasa a false si se aplica un cupón que no se suma

    if (cuponCodigo) {
      // Para usar un cupón hay que haber ingresado con Google
      const usuario = await usuarioDesdeRequest(request)
      if (!usuario) {
        return NextResponse.json(
          { error: MENSAJE_LOGIN, cupon_invalido: true, login_requerido: true },
          { status: 401 }
        )
      }

      // El cupón se valida y se calcula acá, nunca se confía en el descuento que manda el navegador
      const validacion = await validarCuponParaPedido(cuponCodigo, subtotal, usuario.id)
      if (!validacion.ok) {
        return NextResponse.json({ error: validacion.error, cupon_invalido: true }, { status: 400 })
      }

      const seSuma = cuponSeSumaConTransferencia(validacion.cupon.codigo)
      const transferenciaSinCupon = Math.round(subtotal * DESCUENTO_TRANSFERENCIA)
      // Un cupón que no se suma solo se aplica si descuenta MÁS que la transferencia
      const cuponSeAplica = seSuma || validacion.descuento > transferenciaSinCupon

      if (cuponSeAplica) {
        const reservado = await usarCupon(validacion.cupon.codigo)
        if (!reservado) {
          return NextResponse.json(
            { error: 'El cupón no es válido o ya no está disponible.', cupon_invalido: true },
            { status: 400 }
          )
        }
        cuponReservado = validacion.cupon.codigo

        const uso = await reservarUsoCuenta(usuario.id, validacion.cupon.codigo)
        if (uso !== 'ok') {
          await deshacerReservas()
          return NextResponse.json(
            {
              error: uso === 'ya_usado' ? MENSAJE_YA_USADO : 'No pudimos verificar el cupón. Probá de nuevo.',
              cupon_invalido: true,
            },
            { status: 400 }
          )
        }
        usoCuentaReservado = { userId: usuario.id, codigo: validacion.cupon.codigo }

        cupon = validacion.cupon
        descuentoCupon = validacion.descuento
        sumaTransferencia = seSuma
      }
    }

    const subtotalConCupon = subtotal - descuentoCupon
    const descuento = sumaTransferencia ? Math.round(subtotalConCupon * DESCUENTO_TRANSFERENCIA) : 0
    const costoEnvio = calcularCostoEnvio(subtotalConCupon, zonaEnvio)
    const total = subtotalConCupon - descuento + costoEnvio

    // Los descuentos quedan como líneas con precio negativo, así todo suma igual
    // en el admin, en los emails y en la factura
    if (descuentoCupon > 0) {
      itemsPedido.push({
        nombre: nombreLineaCupon(cupon),
        cantidad: 1,
        precio: -descuentoCupon,
        imagen_url: null,
      })
    }

    if (descuento > 0) {
      itemsPedido.push({
        nombre: `Descuento por transferencia (${Math.round(DESCUENTO_TRANSFERENCIA * 100)}%)`,
        cantidad: 1,
        precio: -descuento,
        imagen_url: null,
      })
    }

    const direccion = datosCliente.calle
      ? {
          calle: datosCliente.calle,
          numero: datosCliente.numero,
          pisoDepto: datosCliente.pisoDepto || null,
          ciudad: datosCliente.ciudad,
          codigoPostal: datosCliente.codigoPostal || null,
        }
      : null

    // La tabla identifica cada pedido por esta columna: se usa una referencia propia que arranca con TR-
    const referencia =
      'TR-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase()

    const { data: pedido, error: errorInsert } = await supabaseAdmin
      .from('pedidos')
      .insert({
        mercadopago_payment_id: referencia,
        estado: 'pending',
        metodo_pago: 'transferencia',
        descuento,
        cupon_codigo: cupon ? cupon.codigo : null,
        descuento_cupon: descuentoCupon,
        total,
        items: itemsPedido,
        comprador_email: datosCliente.email || null,
        cliente_nombre: datosCliente.nombre || null,
        cliente_dni: datosCliente.dni || null,
        cliente_telefono: datosCliente.telefono || null,
        direccion,
        zona_envio: zonaEnvio.nombre || null,
        costo_envio: costoEnvio,
        envio_carrier: zonaEnvio.envioCarrier || zonaEnvio.envio_carrier || null,
        envio_service_code: zonaEnvio.envioServiceCode || zonaEnvio.envio_service_code || null,
        envio_branch_code: zonaEnvio.envioBranchCode || zonaEnvio.envio_branch_code || null,
        notas: datosCliente.notas || null,
      })
      .select('id')
      .single()

    if (errorInsert) {
      console.error('Error al guardar el pedido por transferencia:', errorInsert)
      await deshacerReservas()
      return NextResponse.json({ error: 'No se pudo guardar el pedido. Probá de nuevo.' }, { status: 500 })
    }

    // El pedido ya está guardado: los usos del cupón quedan firmes aunque falle algo después (por ejemplo un email)
    if (usoCuentaReservado) {
      await vincularUsoConPedido(usoCuentaReservado.userId, usoCuentaReservado.codigo, pedido.id)
    }
    cuponReservado = null
    usoCuentaReservado = null

    const pedidoParaEmail = {
      id: pedido.id,
      cliente_nombre: datosCliente.nombre || null,
      comprador_email: datosCliente.email || null,
      cliente_telefono: datosCliente.telefono || null,
      cliente_dni: datosCliente.dni || null,
      items: itemsPedido,
      total,
      zona_envio: zonaEnvio.nombre || null,
      costo_envio: costoEnvio,
      direccion,
      notas: datosCliente.notas || null,
    }

    await enviarEmailInstruccionesTransferencia(pedidoParaEmail)
    await enviarEmailNotificacionTransferencia(pedidoParaEmail)

    return NextResponse.json({ pedido_id: pedido.id, total, descuento, descuento_cupon: descuentoCupon })
  } catch (error) {
    console.error('Error al crear pedido por transferencia:', error)
    await deshacerReservas()
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
  }
}
