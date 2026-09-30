// Datos tomados del perfil público de Mercado Libre.
// Actualizá estos valores si cambian: un dato desactualizado resta confianza.
const PERFIL_ML_URL = 'https://www.mercadolibre.com.ar/pagina/dimedetiambos'
const TITULO_TEXTO = 'Reputación en verde en Mercado Libre'
const DETALLES_TEXTO = 'Buena atención · Entrega a tiempo'

export default function ReputacionML() {
  return (
    <div
      style={{
        padding: '16px',
        margin: '20px 0',
        background: '#FAF6F0',
        border: '1px solid #E4DCCF',
        borderRadius: 10,
        color: '#2E2A26',
        lineHeight: 1.4,
      }}
    >
      <p style={{ margin: 0, fontWeight: 'bold', color: '#2F6B63' }}>
        {TITULO_TEXTO}
      </p>
      <p style={{ margin: '4px 0 10px', color: '#8A8378' }}>{DETALLES_TEXTO}</p>
      <a
        href={PERFIL_ML_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#2F6B63', textDecoration: 'underline' }}
      >
        Ver mi perfil en Mercado Libre
      </a>
    </div>
  )
}