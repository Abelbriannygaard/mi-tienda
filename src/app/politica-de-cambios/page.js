export const metadata = {
  title: 'Política de cambios | Dimedeti Ambos',
}

export default function PoliticaDeCambios() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-serif text-3xl text-[#2E2A26]">Política de cambios</h1>

      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-[#3A352F]">
        <p>
          En Dimedeti Ambos no realizamos devoluciones de dinero, pero sí aceptamos cambios
          bajo las siguientes condiciones:
        </p>

        <ul className="list-disc space-y-3 pl-5">
          <li>
            Tenés <strong>7 días corridos</strong> desde que recibís tu pedido para solicitar
            el cambio.
          </li>
          <li>
            La prenda tiene que estar <strong>sin uso</strong>. No es necesario conservar la
            etiqueta.
          </li>
          <li>
            Aceptamos cambios por <strong>talle incorrecto</strong> o por{' '}
            <strong>falla de fabricación</strong>.
          </li>
          <li>
            Si el cambio es por una falla de fabricación, el envío corre por nuestra cuenta.
            Si es por talle, el costo del envío lo cubre el cliente.
          </li>
        </ul>

        <p>
          Para solicitar un cambio, escribinos por WhatsApp contando tu número de pedido y el
          motivo, y te guiamos con los siguientes pasos.
        </p>
      </div>
    </main>
  )
}