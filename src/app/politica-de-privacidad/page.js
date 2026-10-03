export const metadata = {
  title: 'Política de privacidad | Dimedeti Ambos',
}

// COMPLETÁ estos datos antes de publicar.
const TITULAR = {
  nombre: 'ABEL BRIAN NYGAARD',
  cuit: '20-31943343-1',
  domicilio: 'Posadas 2646, Villa Libertad, Provincia de Buenos Aires, CP 1650',
  email: 'negocios@dimedetiambos.com.ar',
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

export default function PoliticaDePrivacidad() {
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
        <h1 className="font-serif text-3xl text-[#2E2A26]">Política de privacidad</h1>
        <p className="mt-3 text-sm text-[#8A8378]">Última actualización: {FECHA_ACTUALIZACION}</p>

        <Seccion titulo="Quién es el responsable de tus datos">
          <p>
            El responsable del tratamiento de los datos personales que se recolectan en este
            sitio es {TITULAR.nombre}, CUIT {TITULAR.cuit}, con domicilio en{' '}
            {TITULAR.domicilio} (en adelante, Dimedeti Ambos). Podés contactarnos en{' '}
            {TITULAR.email}.
          </p>
        </Seccion>

        <Seccion titulo="Qué datos recolectamos">
          <p>
            Cuando hacés una compra te pedimos tu nombre completo, email, DNI, teléfono, la
            dirección de envío y, si querés, notas sobre el pedido. También registramos los
            datos del pedido (productos, importes y estado del pago).
          </p>
          <p>
            No almacenamos los datos de tu tarjeta. El pago se procesa en la plataforma de
            Mercado Pago.
          </p>
        </Seccion>

        <Seccion titulo="Para qué los usamos">
          <p>
            Usamos tus datos para procesar y entregar tu pedido, emitir la factura, enviarte
            confirmaciones y novedades sobre tu compra, atender tus consultas y cumplir con
            obligaciones legales e impositivas. No usamos tus datos para otros fines sin tu
            consentimiento.
          </p>
        </Seccion>

        <Seccion titulo="Con quién los compartimos">
          <p>Para poder concretar tu compra, algunos datos se comparten con terceros:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Mercado Pago, para procesar el pago.</li>
            <li>
              Empresas de transporte (como Andreani, Correo Argentino, OCA y Urbano), para
              entregar tu pedido.
            </li>
            <li>ARCA, para la facturación electrónica.</li>
            <li>
              Proveedores técnicos que nos permiten operar el sitio: Supabase (base de datos),
              Vercel (alojamiento), Resend (envío de emails) y Google reCAPTCHA (protección
              contra el spam).
            </li>
          </ul>
          <p>No vendemos tus datos personales.</p>
        </Seccion>

        <Seccion titulo="Cuánto tiempo los conservamos">
          <p>
            Conservamos tus datos mientras sea necesario para cumplir con las finalidades
            indicadas y con las obligaciones legales y contables que nos corresponden.
          </p>
        </Seccion>

        <Seccion titulo="Tus derechos">
          <p>
            Podés solicitar el acceso, la rectificación, la actualización o la supresión de tus
            datos escribiéndonos a {TITULAR.email}.
          </p>
          <p>
            El titular de los datos personales tiene la facultad de ejercer el derecho de
            acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses,
            salvo que se acredite un interés legítimo al efecto conforme lo establecido en el
            artículo 14, inciso 3 de la Ley Nº 25.326. La Agencia de Acceso a la Información
            Pública, en su carácter de Órgano de Control de la Ley Nº 25.326, tiene la
            atribución de atender las denuncias y reclamos que interpongan quienes resulten
            afectados en sus derechos por incumplimiento de las normas vigentes en materia de
            protección de datos personales.
          </p>
        </Seccion>

        <Seccion titulo="Seguridad">
          <p>
            Adoptamos medidas técnicas para proteger tus datos, como el uso de conexión segura
            (HTTPS). Aun así, ningún sistema es completamente infalible.
          </p>
        </Seccion>

        <Seccion titulo="Cambios en esta política">
          <p>
            Podemos actualizar esta política. La versión vigente es la publicada en esta
            página, con su fecha de actualización.
          </p>
        </Seccion>
      </div>
    </main>
  )
}
