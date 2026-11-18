import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { normalizarCodigo, etiquetaDescuento } from '@/lib/configCupones'
import QrCupon from './QrCupon'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SITIO = 'https://www.dimedetiambos.com.ar'
const CODIGO_VALIDO = /^[A-Z0-9_-]{3,30}$/

function volver(mensaje, tipo = 'error') {
  redirect(`/admin/cupones?${tipo}=${encodeURIComponent(mensaje)}`)
}

// Estas acciones corren en el servidor y están dentro de /admin/cupones,
// así que quedan protegidas igual que el resto del panel.
async function crearCupon(formData) {
  'use server'

  const codigo = normalizarCodigo(formData.get('codigo'))
  const tipo = formData.get('tipo') === 'monto' ? 'monto' : 'porcentaje'
  const valor = Number(formData.get('valor'))
  const maxUsosTexto = String(formData.get('max_usos') || '').trim()
  const compraMinima = Number(formData.get('compra_minima')) || 0
  const desde = String(formData.get('fecha_inicio') || '').trim()
  const hasta = String(formData.get('fecha_fin') || '').trim()

  if (!CODIGO_VALIDO.test(codigo)) {
    volver('El código debe tener entre 3 y 30 caracteres: letras, números, guión o guión bajo.')
  }
  if (!(valor > 0)) volver('Ingresá un valor mayor a 0.')
  if (tipo === 'porcentaje' && valor > 100) volver('El porcentaje no puede superar 100.')

  const maxUsos = maxUsosTexto ? Math.floor(Number(maxUsosTexto)) : null
  if (maxUsosTexto && !(maxUsos > 0)) volver('La cantidad máxima de usos tiene que ser un número mayor a 0.')
  if (compraMinima < 0) volver('La compra mínima no puede ser negativa.')
  if (desde && hasta && hasta < desde) volver('La fecha de fin no puede ser anterior a la de inicio.')

  const { error } = await supabaseAdmin.from('cupones').insert({
    codigo,
    tipo,
    valor,
    max_usos: maxUsos,
    compra_minima: compraMinima,
    // Horario de Argentina: empieza a las 00:00 del día de inicio y termina a las 23:59 del día de fin
    fecha_inicio: desde ? `${desde}T00:00:00-03:00` : null,
    fecha_fin: hasta ? `${hasta}T23:59:59-03:00` : null,
  })

  if (error) {
    console.error('Error al crear el cupón:', error)
    volver(error.code === '23505' ? 'Ya existe un cupón con ese código.' : 'No se pudo crear el cupón.')
  }

  revalidatePath('/admin/cupones')
  volver('Cupón creado.', 'ok')
}

async function alternarCupon(formData) {
  'use server'
  const id = Number(formData.get('id'))
  const estabaActivo = formData.get('activo') === 'true'
  await supabaseAdmin.from('cupones').update({ activo: !estabaActivo }).eq('id', id)
  revalidatePath('/admin/cupones')
}

// Solo se pueden eliminar cupones apagados, para no borrar uno activo por error
async function eliminarCupon(formData) {
  'use server'
  const id = Number(formData.get('id'))
  await supabaseAdmin.from('cupones').delete().eq('id', id).eq('activo', false)
  revalidatePath('/admin/cupones')
}

function estadoDe(cupon, ahora) {
  if (!cupon.activo) return { label: 'Apagado', fondo: '#f3f4f6', texto: '#6b7280' }
  if (cupon.fecha_fin && new Date(cupon.fecha_fin) < ahora) return { label: 'Vencido', fondo: '#fee2e2', texto: '#b91c1c' }
  if (cupon.max_usos != null && cupon.usos >= cupon.max_usos) return { label: 'Agotado', fondo: '#fee2e2', texto: '#b91c1c' }
  if (cupon.fecha_inicio && new Date(cupon.fecha_inicio) > ahora) return { label: 'Aún no empieza', fondo: '#fef9c3', texto: '#a16207' }
  return { label: 'Activo', fondo: '#dcfce7', texto: '#15803d' }
}

function fechaCorta(valor) {
  return new Date(valor).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
}

const campoStyle = {
  display: 'block',
  width: '100%',
  padding: '8px 10px',
  marginTop: '4px',
  border: '1px solid #ccc',
  borderRadius: '6px',
  boxSizing: 'border-box',
}

const botonChico = {
  padding: '6px 14px',
  fontSize: '13px',
  border: '1px solid #ccc',
  borderRadius: '6px',
  background: '#fff',
  cursor: 'pointer',
}

export default async function PanelCupones({ searchParams }) {
  const { error: mensajeError, ok: mensajeOk } = await searchParams

  const { data: cupones, error } = await supabaseAdmin
    .from('cupones')
    .select('*')
    .order('created_at', { ascending: false })

  const ahora = new Date()

  return (
    <main style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>🎟️ Cupones de descuento</h1>
        <Link
          href="/admin"
          style={{ padding: '8px 16px', fontSize: '14px', border: '1px solid #999', borderRadius: '8px', color: '#555', textDecoration: 'none' }}
        >
          ← Volver a pedidos
        </Link>
      </div>

      {mensajeError && <p style={{ color: '#b91c1c', marginBottom: '12px' }}>{mensajeError}</p>}
      {mensajeOk && <p style={{ color: '#15803d', marginBottom: '12px' }}>{mensajeOk}</p>}

      <form
        action={crearCupon}
        style={{ border: '1px solid #e5e5e5', borderRadius: '10px', padding: '20px', backgroundColor: '#fff', marginBottom: '28px' }}
      >
        <h2 style={{ margin: '0 0 14px', fontSize: '17px' }}>Crear cupón</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <label style={{ fontSize: '14px' }}>
            Código *
            <input name="codigo" required placeholder="VERANO10" style={{ ...campoStyle, textTransform: 'uppercase' }} />
          </label>
          <label style={{ fontSize: '14px' }}>
            Tipo de descuento
            <select name="tipo" defaultValue="porcentaje" style={campoStyle}>
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="monto">Monto fijo ($)</option>
            </select>
          </label>
          <label style={{ fontSize: '14px' }}>
            Valor *
            <input name="valor" type="number" min="1" step="any" required placeholder="10" style={campoStyle} />
          </label>
          <label style={{ fontSize: '14px' }}>
            Compra mínima en productos ($)
            <input name="compra_minima" type="number" min="0" placeholder="0" style={campoStyle} />
          </label>
          <label style={{ fontSize: '14px' }}>
            Usos máximos (vacío = sin límite)
            <input name="max_usos" type="number" min="1" placeholder="Sin límite" style={campoStyle} />
          </label>
          <label style={{ fontSize: '14px' }}>
            Desde (opcional)
            <input name="fecha_inicio" type="date" style={campoStyle} />
          </label>
          <label style={{ fontSize: '14px' }}>
            Hasta (opcional)
            <input name="fecha_fin" type="date" style={campoStyle} />
          </label>
        </div>
        <button
          type="submit"
          style={{ marginTop: '16px', padding: '10px 20px', border: 'none', borderRadius: '8px', color: 'white', backgroundColor: '#2F6B63', cursor: 'pointer', fontSize: '15px' }}
        >
          Crear cupón
        </button>
        <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#888' }}>
          El cupón descuenta solo los productos (no el envío) y se aplica antes del descuento por transferencia.
        </p>
      </form>

      {error && <p style={{ color: '#dc2626' }}>Error al cargar los cupones: {error.message}</p>}

      {!error && (!cupones || cupones.length === 0) && (
        <p style={{ color: '#888' }}>Todavía no creaste ningún cupón.</p>
      )}

      {!error && cupones && cupones.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cupones.map((cupon) => {
            const estado = estadoDe(cupon, ahora)
            const minimo = Number(cupon.compra_minima) || 0
            const link = `${SITIO}/?cupon=${encodeURIComponent(cupon.codigo)}`

            return (
              <div key={cupon.id} style={{ border: '1px solid #e5e5e5', borderRadius: '10px', padding: '20px', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px', letterSpacing: '0.5px' }}>{cupon.codigo}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
                      {etiquetaDescuento(cupon)} en productos
                      {minimo > 0 ? ` · compra mínima $${minimo.toLocaleString('es-AR')}` : ''}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>
                      Usos: {cupon.usos}
                      {cupon.max_usos != null ? ` de ${cupon.max_usos}` : ' (sin límite)'}
                      {cupon.fecha_inicio ? ` · desde ${fechaCorta(cupon.fecha_inicio)}` : ''}
                      {cupon.fecha_fin ? ` · hasta ${fechaCorta(cupon.fecha_fin)}` : ''}
                    </p>
                  </div>
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: estado.fondo,
                      color: estado.texto,
                    }}
                  >
                    {estado.label}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                  <form action={alternarCupon}>
                    <input type="hidden" name="id" value={cupon.id} />
                    <input type="hidden" name="activo" value={String(cupon.activo)} />
                    <button type="submit" style={botonChico}>
                      {cupon.activo ? 'Apagar' : 'Activar'}
                    </button>
                  </form>
                  {!cupon.activo && (
                    <form action={eliminarCupon}>
                      <input type="hidden" name="id" value={cupon.id} />
                      <button type="submit" style={{ ...botonChico, color: '#b91c1c', borderColor: '#fca5a5' }}>
                        Eliminar
                      </button>
                    </form>
                  )}
                </div>

                <QrCupon url={link} codigo={cupon.codigo} />
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
