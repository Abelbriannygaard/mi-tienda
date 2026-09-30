const PERFIL_ML_URL =
  'https://articulo.mercadolibre.com.ar/MLA-1371072023-ambo-medico-kinesiologiaodontpeluquera-cuello-mao-spandex-_JM?searchVariation=178404099289#polycard_client=mshops-appearance-api&title=Productos+recomendados&tracking_id=688d35297a89ef222359201d37fadf04&component=collection_grid&sid=storefronts&global_position=6'

export default function ReputacionML() {
  return (
    <a
      href={PERFIL_ML_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'block', maxWidth: 320, margin: '20px auto' }}
    >
      <img
        src="/img/reputacion-ml.png"
        alt="Reputación de Dimedetiambos en Mercado Libre"
        style={{ width: '100%', borderRadius: 12, border: '1px solid #E4DCCF' }}
      />
    </a>
  )
}