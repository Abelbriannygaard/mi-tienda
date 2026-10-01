import ReputacionML from './ReputacionML'

export const metadata = {
  title: 'Quiénes somos | Dimedeti Ambos',
}

export default function QuienesSomos() {
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
      <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-serif text-3xl text-[#2E2A26]">Quiénes somos</h1>

      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-[#3A352F]">
        <p>
          Somos Dimedeti Ambos, una marca dedicada a la indumentaria médica y sanitaria desde
          hace más de 5 años. Lo que nos distingue es el toque personal en el diseño: detrás
          de cada prenda hay una modista de alta costura, algo poco común en un rubro donde la
          mayoría de las opciones son básicas y todas iguales.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <video
           src="/video/proceso-corte.mp4"
             autoPlay
             loop
             muted
             playsInline
             className="w-full rounded-xl border border-[#E4DCCF]"
          />
           <video
             src="/video/proceso-costura.mp4"
             autoPlay
             loop
             muted
             playsInline
             className="w-full rounded-xl border border-[#E4DCCF]"
         />
         </div>

<p className="mt-2 text-xs text-[#8A8378]">
  Un oficio de familia: aprendí a cortar y coser con mi mamá, modista de toda la vida.
</p>
        
        <p>
          Esa mirada de diseño no nació pensando en ambos médicos, sino en vestidos de novia.
          Ese era nuestro trabajo antes de 2020. Pero con la pandemia, las restricciones para
          reunirse hicieron que los casamientos se frenaran, y con ellos, gran parte de
          nuestro trabajo.
        </p>

        <p>
          Tuvimos que reinventarnos. En ese momento, una clienta nos hizo un pedido especial:
          un ambo médico con diseño, algo que no se conseguía en el mercado, donde todo era
          genérico. Aceptamos el desafío, y ese primer ambo terminó siendo el punto de partida
          de todo lo que somos hoy.
        </p>

        <p>
          El sector de la salud fue de los pocos que siguió moviéndose durante la pandemia, y
          la demanda por ambos con un diseño distinto creció rápido. A partir de ese pedido
          empezamos a publicar en Mercado Libre, y así nació Dimedeti Ambos tal como lo
          conocés hoy.
        </p>

        <p>
          Seguimos con la misma filosofía de siempre: prendas médicas y sanitarias pensadas
          con mirada de diseño, hechas con la misma dedicación artesanal con la que antes
          armábamos vestidos de novia. Desde 2020 realizamos más de 1.000 ventas a
          profesionales de la salud de todo el país.
        </p>

        <ReputacionML />
      </div>
      </div>
    </main>
  )
}