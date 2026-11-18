'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

// Genera el QR de un cupón en el navegador y permite descargarlo para imprimir
export default function QrCupon({ url, codigo }) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    QRCode.toDataURL(url, { width: 600, margin: 2, errorCorrectionLevel: 'M' })
      .then(setSrc)
      .catch(() => setSrc(null))
  }, [url])

  if (!src) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
      <img src={src} alt={`QR del cupón ${codigo}`} width={110} height={110} style={{ border: '1px solid #e5e5e5', borderRadius: '6px' }} />
      <div style={{ fontSize: '13px', color: '#666' }}>
        <p style={{ margin: '0 0 6px', wordBreak: 'break-all' }}>{url}</p>
        <a
          href={src}
          download={`qr-cupon-${codigo}.png`}
          style={{ color: '#2F6B63', fontWeight: 600 }}
        >
          ⬇️ Descargar QR
        </a>
      </div>
    </div>
  )
}
