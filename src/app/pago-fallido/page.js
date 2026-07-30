export default function PagoFallido() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ color: '#dc2626', fontSize: '28px' }}>❌ El pago no pudo procesarse</h1>
      <p style={{ marginTop: '12px', fontSize: '16px' }}>
        Hubo un problema al procesar tu pago. Podés intentar de nuevo.
      </p>
      <a href="/" style={{ display: 'inline-block', marginTop: '24px', color: '#009ee3' }}>
        ← Volver a la tienda
      </a>
    </div>
  )
}