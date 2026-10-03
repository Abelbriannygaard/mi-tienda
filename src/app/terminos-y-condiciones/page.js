import Link from 'next/link'

export const metadata = {
  title: 'Términos y condiciones | Dimedeti Ambos',
}

// COMPLETÁ estos datos antes de publicar.
const TITULAR = {
  nombre: 'ABEL BRIAN NYGAARD',
  cuit: '20-31943343-1',
  domicilio: 'COMPLETAR: domicilio',
  email: 'COMPLETAR: email de contacto',
}

const FECHA_ACTUALIZACION = 'octubre de 2026'

function Seccion({ titulo, children }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-xl text-[#2E2A26]">{titulo}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  )
}

export default function TerminosYCondiciones() {
  return (
    <main
      className="min-h-screen"
      style={{
        backgroundImage:
          'linear-gradient(rgba(250,246,240,0.88), rgba(250,246,240,0.94)), url(/img/fondo-tela-negra.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="mx-auto max-w-2xl px-6 py-16 text-[15px] leading-relaxed text-[#3A352F]">
        <h1 className="font-serif text-3xl text-[#2E2A26]">Términos y condiciones</h1>
        <p className="mt-3 text-sm text-[#8A8378]">Última actualización: {FECHA_ACTUALIZACION}</p>

        <Seccion titulo="Quiénes somos">
          <p>
            Este sitio es operado por {TITULAR.nombre}, CUIT {TITULAR.cuit}, con domicilio en{' '}
            {TITULAR.domicilio}, bajo la marca Dimedeti Ambos. Contacto: {TITULAR.email}.
          </p>
        </Seccion>

        <Seccion titulo="Productos y precios">
          <p>
            Los precios están expresados en pesos argentinos. Las imágenes y descripciones
            buscan ser lo más fieles posible, aunque los colores pueden variar levemente según
            la pantalla. Nos reservamos el derecho de corregir errores evidentes de precio o
            de descripción antes de confirmar un pedido.
          </p>
        </Seccion>

        <Seccion titulo="Pagos">
          <p>
            Los pagos se procesan a través de Mercado Pago. El pedido se confirma una vez que
            el pago es aprobado.
          </p>
        </Seccion>

        <Seccion titulo="Envíos y retiro">
          <p>
            El costo y las opciones de envío se calculan en el checkout según el código postal
            de destino. También ofrecemos retiro en persona. Los plazos de entrega son
            estimados y dependen de la empresa de transporte. COMPLETAR: plazo de preparación
            del pedido.
          </p>
        </Seccion>

        <Seccion titulo="Facturación">
          <p>
            Emitimos factura electrónica por cada compra y la enviamos al email indicado en el
            pedido.
          </p>
        </Seccion>

        <Seccion titulo="Derecho de arrepentimiento">
          <p>
            Tenés derecho a arrepentirte de tu compra dentro de los 10 días corridos desde
            que recibís el producto, sin costo alguno para vos, conforme al artículo 34 de la
            Ley Nº 24.240. Para ejercerlo, usá el botón de arrepentimiento disponible en la
            página de inicio.
          </p>
        </Seccion>

        <Seccion titulo="Cambios y devoluciones">
          <p>
            Las condiciones para cambios y devoluciones están en nuestra{' '}
            <Link href="/politica-de-cambios" className="text-[#2F6B63] underline">
              política de cambios
            </Link>
            .
          </p>
        </Seccion>

        <Seccion titulo="Datos personales">
          <p>
            El tratamiento de tus datos se rige por nuestra{' '}
            <Link href="/politica-de-privacidad" className="text-[#2F6B63] underline">
              política de privacidad
            </Link>
            .
          </p>
        </Seccion>

        <Seccion titulo="Propiedad intelectual">
          <p>
            El contenido del sitio (textos, imágenes, diseños y marca) pertenece a Dimedeti
            Ambos y no puede reproducirse sin autorización.
          </p>
        </Seccion>

        <Seccion titulo="Defensa del consumidor">
          <p>
            Ante cualquier inconveniente, escribinos primero a {TITULAR.email}. También podés
            acudir a la autoridad de Defensa del Consumidor de tu jurisdicción.
          </p>
        </Seccion>

        <Seccion titulo="Ley aplicable">
          <p>Estos términos se rigen por las leyes de la República Argentina.</p>
        </Seccion>
      </div>
    </main>
  )
}
