import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'

export async function generarFacturaPdf({ pedido, resultado, puntoVenta, tipoComprobante }) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = 800

  const dibujarTexto = (texto, x, tamano = 11, negrita = false) => {
    page.drawText(texto, {
      x,
      y,
      size: tamano,
      font: negrita ? fontBold : font,
      color: rgb(0, 0, 0),
    })
  }

  dibujarTexto('Dimedeti Ambos', 40, 18, true)
  y -= 20
  dibujarTexto('FACTURA C', 40, 14, true)
  y -= 20
  dibujarTexto(`Punto de Venta: ${String(puntoVenta).padStart(4, '0')}  Comp. Nro: ${String(resultado.voucher_number).padStart(8, '0')}`, 40)
  y -= 40

  dibujarTexto(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 40)
  y -= 20
  dibujarTexto(`CUIT: ${process.env.AFIP_CUIT}`, 40)
  y -= 20
  dibujarTexto('Condición frente al IVA: Monotributo', 40)
  y -= 40

  dibujarTexto(`Cliente: ${pedido.cliente_nombre || 'Consumidor Final'}`, 40)
  y -= 20
  if (pedido.cliente_dni) {
    dibujarTexto(`DNI: ${pedido.cliente_dni}`, 40)
    y -= 20
  }
  y -= 20

  dibujarTexto('Detalle:', 40, 12, true)
  y -= 20
  for (const item of pedido.items || []) {
    if (item.nombre?.toLowerCase().startsWith('envío')) continue
    dibujarTexto(`${item.cantidad} x ${item.nombre} — $${item.precio}`, 50)
    y -= 18
  }
  y -= 20

  dibujarTexto(`TOTAL: $${pedido.total}`, 40, 14, true)
  y -= 50

  dibujarTexto(`CAE: ${resultado.CAE}`, 40)
  y -= 20
  dibujarTexto(`Vencimiento CAE: ${resultado.CAEFchVto}`, 40)
  y -= 60

  // QR fiscal obligatorio (RG 4291)
  const qrPayload = {
    ver: 1,
    fecha: new Date().toISOString().slice(0, 10),
    cuit: Number(process.env.AFIP_CUIT),
    ptoVta: puntoVenta,
    tipoCmp: tipoComprobante,
    nroCmp: resultado.voucher_number,
    importe: Number(pedido.total),
    moneda: 'PES',
    ctz: 1,
    tipoDocRec: pedido.cliente_dni ? 96 : 99,
    nroDocRec: pedido.cliente_dni ? Number(pedido.cliente_dni.replace(/\D/g, '')) : 0,
    tipoCodAut: 'E',
    codAut: Number(resultado.CAE),
  }

  const qrUrl = `https://www.afip.gob.ar/fe/qr/?p=${Buffer.from(JSON.stringify(qrPayload)).toString('base64')}`
  const qrDataUrl = await QRCode.toDataURL(qrUrl)
  const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64')
  const qrImage = await pdfDoc.embedPng(qrImageBytes)

  page.drawImage(qrImage, { x: 40, y: y - 100, width: 100, height: 100 })

  return await pdfDoc.save()
}