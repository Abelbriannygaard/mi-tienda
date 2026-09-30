// Tarjeta de reputación real de Mercado Libre.
// Actualizá el link si cambia el producto de referencia.
const PERFIL_ML_URL =
  'https://articulo.mercadolibre.com.ar/MLA-1371072023-ambo-medico-kinesiologiaodontpeluquera-cuello-mao-spandex-_JM?searchVariation=178404099289#polycard_client=mshops-appearance-api&title=Productos+recomendados&tracking_id=688d35297a89ef222359201d37fadf04&component=collection_grid&sid=storefronts&global_position=6'

const NOMBRE_TIENDA = 'DIMEDETIAMBOS'
const SEGUIDORES_TEXTO = '+20 Seguidores'
const PRODUCTOS_TEXTO = '+25 Productos'

export default function ReputacionML() {
  return (
    <a
      href={PERFIL_ML_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        maxWidth: 320,
        margin: '20px auto',
        padding: '18px 20px',
        background: '#FFFFFF',
        border: '1px solid #E4DCCF',
        borderRadius: 12,
        textDecoration: 'none',
        color: '#2E2A26',
      }}
    >
      {/* Encabezado: avatar + nombre + stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: '#2E2A26',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        >
          DA
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: 15, letterSpacing: '0.3px' }}>
            {NOMBRE_TIENDA}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#5C564C' }}>
            {SEGUIDORES_TEXTO} &nbsp;{PRODUCTOS_TEXTO}
          </p>
        </div>
      </div>

      {/* Termómetro de reputación */}
      <div style={{ display: 'flex', gap: 3, marginTop: 14 }}>
        <span style={{ flex: 1, height: 6, borderRadius: 3, background: '#F5C4B3' }} />
        <span style={{ flex: 1, height: 6, borderRadius: 3, background: '#F5C4B3' }} />
        <span style={{ flex: 1, height: 6, borderRadius: 3, background: '#FAC775' }} />
        <span style={{ flex: 1, height: 6, borderRadius: 3, background: '#FAC775' }} />
        <span style={{ flex: 1, height: 6, borderRadius: 3, background: '#1D9E75' }} />
      </div>

      {/* Buena atención / Entrega a tiempo */}
      <div style={{ display: 'flex', gap: 24, marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            <path d="M8 12l2.5 2.5L16 9" />
          </svg>
          <span style={{ fontSize: 12, color: '#5C564C' }}>Buena