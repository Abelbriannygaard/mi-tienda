export const metadata = {
  title: 'Guía de talles | Dimedeti Ambos',
}

// Todas las medidas están en centímetros.

const COLUMNAS_MUJER = [
  'Talle',
  'Contorno de pecho',
  'Contorno de cintura',
  'Contorno de cadera',
  'Largo de pantalón',
]

const FILAS_MUJER = [
  { talle: 'XS', valores: [88, 68, 92, 97] },
  { talle: 'S', valores: [92, 72, 96, 98] },
  { talle: 'M', valores: [100, 80, 104, 99] },
  { talle: 'L', valores: [108, 88, 112, 100] },
  { talle: 'XL', valores: [114, 92, 119, 100] },
  { talle: 'XXL', valores: [120, 99, 126, 101] },
]

const COLUMNAS_HOMBRE = [
  'Talle',
  'Contorno de pecho',
  'Contorno de cintura',
  'Contorno de cadera',
  'Altura',
]

const FILAS_HOMBRE = [
  { talle: 'XS', equivalencia: '38-40', valores: ['82-89', '66-72', '85-90', '165-169'] },
  { talle: 'S', equivalencia: '42-44', valores: ['90-97', '73-79', '91-96', '170-174'] },
  { talle: 'M', equivalencia: '46-48', valores: ['98-105', '80-85', '97-102', '175-179'] },
  { talle: 'L', equivalencia: '50-52', valores: ['106-113', '86-93', '103-108', '180-184'] },
  { talle: 'XL', equivalencia: '54-56', valores: ['114-121', '93-99', '109-114', '185-189'] },
]

function Tabla({ columnas, filas }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-[#E4DCCF] bg-white">
      <table className="w-full min-w-[480px] border-collapse text-center text-[15px] text-[#2E2A26]">
        <thead>
          <tr className="bg-[#2F6B63] text-white">
            {columnas.map((columna) => (
              <th key={columna} scope="col" className="px-3 py-3 font-semibold">
                {columna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={fila.talle} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAF6F0]'}>
              <th scope="row" className="px-3 py-3 font-semibold text-[#2F6B63]">
                {fila.talle}
                {fila.equivalencia && (
                  <span className="block text-xs font-normal text-[#8A8378]">
                    {fila.equivalencia}
                  </span>
                )}
              </th>
              {fila.valores.map((valor, j) => (
                <td key={j} className="px-3 py-3">
                  {valor}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function GuiaDeTalles() {
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
        <h1 className="font-serif text-3xl text-[#2E2A26]">Guía de talles</h1>

        <p className="mt-6 text-[15px] leading-relaxed text-[#3A352F]">
          Todas las medidas están en centímetros. Las tablas de mujer y de hombre se leen de
          forma distinta, así que fijate en la aclaración de cada una.
        </p>

        <section id="mujer" className="mt-10 scroll-mt-24">
          <h2 className="font-serif text-2xl text-[#2E2A26]">Mujer</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[#3A352F]">
            Medidas de la prenda terminada.
          </p>
          <Tabla columnas={COLUMNAS_MUJER} filas={FILAS_MUJER} />
        </section>

        <section id="hombre" className="mt-12 scroll-mt-24">
          <h2 className="font-serif text-2xl text-[#2E2A26]">Hombre</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[#3A352F]">
            Medidas del cuerpo. Cada rango va del mínimo al máximo de ese talle.
          </p>
          <Tabla columnas={COLUMNAS_HOMBRE} filas={FILAS_HOMBRE} />
        </section>

        <h2 className="mt-12 font-serif text-2xl text-[#2E2A26]">Cómo elegir tu talle</h2>

        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-[#3A352F]">
          <p>
            <strong>Mujer:</strong> como la tabla es de la prenda, la forma más segura es
            comparar con una prenda tuya que te quede bien. Apoyala estirada sobre una
            superficie plana, medí el ancho del pecho, de la cintura y de la cadera, y
            duplicá cada valor para compararlo con el contorno de la tabla. El largo de
            pantalón se mide desde la cintura hasta el borde inferior.
          </p>
          <p>
            <strong>Hombre:</strong> tomate las medidas del cuerpo con una cinta métrica,
            sin apretar. Pecho: la parte más ancha del pecho. Cintura: la parte más
            angosta del torso, a la altura del ombligo aproximadamente. Cadera: la parte
            más ancha, con los pies juntos. Altura: de pie y sin calzado.
          </p>
          <p>
            Si tenés dudas o estás entre dos talles, escribinos por WhatsApp y te ayudamos a
            elegir.
          </p>
        </div>
      </div>
    </main>
  )
}