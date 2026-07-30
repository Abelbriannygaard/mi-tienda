export default function PagoPendiente() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ color: '#ca8a04', fontSize: '28px' }}>⏳ Tu pago está pendiente</h1>
      <p style={{ marginTop: '12px', fontSize: '16px' }}>
        Estamos esperando la confirmación de tu pago. Te avisaremos apenas se acredite.
      </p>
      <a href="/" style={{ display: 'inline-block', marginTop: '24px', color: '#009ee3' }}>
        ← Volver a la tienda
      </a>
    </div>
  )
}