import { createClient } from '@supabase/supabase-js'
import CerrarSesionBoton from './CerrarSesionBoton'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const coloresEstado = {
  approved: { fondo: '#dcfce7', texto: '#15803d', label: 'Aprobado' },
  pending: { fondo: '#fef9c3', texto: '#a16207', label: 'Pendiente' },
  in_process: { fondo: '#fef9c3', texto: '#a16207', label: 'En proceso' },
  rejected: { fondo: '#fee2e2', texto: '#b91c1c', label: 'Rechazado' },
  cancelled: { fondo: '#f3f4f6', texto: '#6b7280', label: 'Cancelado' },
}

export default async function PanelAdmin() {
  const { data: pedidos, error } = await supabaseAdmin
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Pedidos</h1>
        <CerrarSesionBoton />
      </div>

      {error && (
        <p style={{ color: '#dc2626' }}>Error al cargar los pedidos: {error.message}</p>
      )}

      {!error && (!pedidos || pedidos.length === 0) && (
        <p style={{ color: '#888' }}>Todavía no hay pedidos registrados.</p>
      )}

      {!error && pedidos && pedidos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pedidos.map((pedido) => {
            const estado = coloresEstado[pedido.estado] || {
              fondo: '#f3f4f6',
              texto: '#6b7280',
              label: pedido.estado,
            }

            return (
              <div
                key={pedido.id}
                style={{
                  border: '1px solid #e5e5e5',
                  borderRadius: '10px',
                  padding: '20px',
                  backgroundColor: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>
                      {pedido.cliente_nombre || 'Sin nombre'}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
                      {pedido.comprador_email}
                      {pedido.cliente_telefono ? ` · ${pedido.cliente_telefono}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: estado.fondo,
                        color: estado.texto,
                      }}
                    >
                      {estado.label}
                    </span>
                    <p style={{ margin: '6px 0 0', fontWeight: 'bold', fontSize: '18px' }}>
                      ${pedido.total}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '14px', borderTop: '1px solid #f0f0f0', paddingTop: '14px' }}>
                  {(pedido.items || []).map((item, idx) => (
                    <p key={idx} style={{ margin: '2px 0', fontSize: '14px', color: '#333' }}>
                      {item.cantidad} x {item.nombre} — ${item.precio}
                    </p>
                  ))}
                </div>

                {pedido.direccion && (
                  <p style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
                    📍 {pedido.direccion.calle} {pedido.direccion.numero}
                    {pedido.direccion.pisoDepto ? `, ${pedido.direccion.pisoDepto}` : ''}, {pedido.direccion.ciudad} (CP {pedido.direccion.codigoPostal})
                    {pedido.zona_envio ? ` · Envío: ${pedido.zona_envio} ($${pedido.costo_envio})` : ''}
                  </p>
                )}

                {pedido.notas && (
                  <p style={{ marginTop: '6px', fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                    Nota: {pedido.notas}
                  </p>
                )}

                <p style={{ marginTop: '10px', fontSize: '12px', color: '#aaa' }}>
                  Pago #{pedido.mercadopago_payment_id} · {new Date(pedido.created_at).toLocaleString('es-AR')}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}